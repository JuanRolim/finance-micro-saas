const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");

const source = fs.readFileSync(
    path.join(__dirname, "..", "js", "services", "api.js"),
    "utf8"
);

function criarContextoApi(fetchMock, href = "http://localhost:3000/") {
    const armazenamento = new Map();
    const context = vm.createContext({
        URLSearchParams,
        URL,
        TextEncoder,
        Date,
        crypto: webcrypto,
        sessionStorage: {
            get length() { return armazenamento.size; },
            getItem(chave) { return armazenamento.get(chave) || null; },
            setItem(chave, valor) { armazenamento.set(chave, valor); },
            key(indice) { return Array.from(armazenamento.keys())[indice] || null; },
            removeItem(chave) { armazenamento.delete(chave); }
        },
        gerarIdUnico: () => "stable-operation-id",
        console: { error() {} },
        fetch: fetchMock,
        window: { location: { href } }
    });
    vm.runInContext(source, context, { filename: "js/services/api.js" });
    return context;
}

function respostaApi(dados, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => typeof dados === "string" ? dados : JSON.stringify(dados)
    };
}

test("invalidates cached classifications only after a confirmed persistent update", async () => {
    let leituras = 0;
    const chamadas = [];
    const context = criarContextoApi(async (url, options = {}) => {
        chamadas.push({ url: String(url), options });
        if (!options.method) {
            leituras += 1;
            const nome = leituras === 1 ? "Antiga" : "Nova";
            return respostaApi({ classificacoes: [{ categoria: nome }] });
        }
        return respostaApi({
            success: true,
            classificacoes: [{ categoria: "Nova" }]
        });
    });

    const primeira = await context.obterConfiguracoesClassificacao();
    assert.equal(primeira.classificacoes[0].categoria, "Antiga");
    await context.salvarClassificacao({
        operacao: "renomear-categoria",
        categoria: "Antiga",
        novaCategoria: "Nova"
    });
    const atualizada = await context.obterConfiguracoesClassificacao();

    assert.equal(atualizada.classificacoes[0].categoria, "Nova");
    assert.equal(leituras, 2);
    assert.equal(
        new URL(chamadas[0].url).origin,
        "http://localhost:3000"
    );
    assert.equal(
        new URL(chamadas[0].url).pathname,
        "/api/finance"
    );
    assert.equal(chamadas[1].options.method, "POST");
    assert.equal(
        new URLSearchParams(chamadas[1].options.body).get("acao"),
        "gerenciarClassificacao"
    );
});

test("refuses API calls from file URLs before invoking fetch", async () => {
    let chamadas = 0;
    const context = criarContextoApi(async () => {
        chamadas += 1;
        throw new Error("fetch must not run");
    }, "file:///C:/Users/test/index.html");

    await assert.rejects(
        context.obterDashboard(),
        (error) => error.name === "ApiConfigurationError" &&
            /file:\/\/.*HTTP ou HTTPS/.test(error.message) &&
            /npx vercel dev/.test(error.message)
    );
    assert.equal(chamadas, 0);
});

test("builds dashboard query parameters on the app's HTTP origin", async () => {
    let urlChamada = "";
    const context = criarContextoApi(async (url) => {
        urlChamada = String(url);
        return respostaApi({ saldo: 100 });
    }, "https://finance.example.com/some/page");

    await context.obterDashboard();
    const url = new URL(urlChamada);

    assert.equal(url.origin, "https://finance.example.com");
    assert.equal(url.pathname, "/api/finance");
    assert.equal(url.searchParams.get("acao"), "dashboard");
    assert.ok(url.searchParams.get("t"));
});

test("reports a missing API route distinctly", async () => {
    const context = criarContextoApi(async () =>
        respostaApi("<!doctype html>not found", 404)
    );

    await assert.rejects(
        context.obterDashboard(),
        (error) => error.name === "ApiRouteNotFoundError" &&
            /rota \/api\/finance não existe/.test(error.message)
    );
});

test("classifies GET connection and server failures without write uncertainty", async () => {
    const connectionContext = criarContextoApi(async () => {
        throw new Error("offline");
    });
    await assert.rejects(
        connectionContext.obterDashboard(),
        (error) => error.name === "ApiConnectionError" &&
            !/gravação é desconhecida/.test(error.message)
    );

    const serverContext = criarContextoApi(async () =>
        respostaApi({ success: false, message: "Backend indisponível." }, 503)
    );
    await assert.rejects(
        serverContext.obterDashboard(),
        (error) => error.name === "ApiServerUnavailableError" &&
            /Backend indisponível/.test(error.message)
    );
});

test("reuses the same idempotency key after an uncertain meta creation", async () => {
    const operationIds = [];
    let attempts = 0;
    const context = criarContextoApi(async (_url, options) => {
        operationIds.push(
            new URLSearchParams(options.body).get("idOperacao")
        );
        attempts += 1;
        return attempts === 1
            ? respostaApi({
                success: false,
                outcomeUnknown: true,
                message: "Resultado desconhecido."
            }, 504)
            : respostaApi({ success: true, idMeta: "M020" });
    });
    const meta = {
        nome: "Meta de teste",
        valorMeta: 500,
        tipo: "ATIVA",
        prioridade: "MÉDIA"
    };

    await assert.rejects(
        context.criarMeta(meta),
        (error) => error.name === "ApiOutcomeUnknownError"
    );
    const resultado = await context.criarMeta(meta);

    assert.equal(resultado.idMeta, "M020");
    assert.equal(operationIds.length, 2);
    assert.ok(operationIds[0]);
    assert.equal(operationIds[1], operationIds[0]);
});

test("does not submit a write if operation id storage is unavailable", async () => {
    let chamadas = 0;
    const context = criarContextoApi(async () => {
        chamadas += 1;
        return respostaApi({ success: true });
    });
    context.sessionStorage.setItem = () => {
        throw new Error("storage disabled");
    };

    await assert.rejects(
        context.criarMeta({ nome: "Meta", valorMeta: 10 }),
        (error) => error.name === "ApiIdempotencyStorageError"
    );
    assert.equal(chamadas, 0);
});

test("rejects unsuccessful backend responses for all mutation endpoints", async () => {
    const context = criarContextoApi(async () =>
        respostaApi({ success: false, message: "Meta não encontrada." })
    );

    await assert.rejects(
        context.encerrarMeta("M001"),
        /Meta não encontrada/
    );
});

test("treats missing or malformed write confirmations as uncertain outcomes", async () => {
    const emptyContext = criarContextoApi(async () => respostaApi(""));
    await assert.rejects(
        emptyContext.criarMeta({ nome: "Reserva", valorMeta: 100 }),
        (error) => error.name === "ApiOutcomeUnknownError"
    );

    const invalidContext = criarContextoApi(async () => respostaApi("not-json"));
    await assert.rejects(
        invalidContext.concluirDesejo("M002"),
        (error) => error.name === "ApiOutcomeUnknownError"
    );
});

test("reports network failures as an unknown operation result", async () => {
    const context = criarContextoApi(async () => {
        throw new Error("offline");
    });

    await assert.rejects(
        context.transformarDesejoEmMeta("M003"),
        (error) => error.name === "ApiNetworkError" &&
            /confirmação da gravação é desconhecida/.test(error.message)
    );
});

test("requires a matching movement id in the backend success confirmation", async () => {
    const context = criarContextoApi(async () =>
        respostaApi({ success: true, idMovimentacao: "different-id" })
    );

    await assert.rejects(
        context.salvarNaPlanilha({ idMovimentacao: "expected-id", valor: 10 }),
        (error) => error.name === "ApiOutcomeUnknownError"
    );
});

test("preserves the unknown-outcome marker returned by the Vercel API", async () => {
    const context = criarContextoApi(async () =>
        respostaApi({
            success: false,
            outcomeUnknown: true,
            message: "O resultado da gravação é desconhecido."
        }, 504)
    );

    await assert.rejects(
        context.salvarNaPlanilha({ idMovimentacao: "stable-id", valor: 10 }),
        (error) => error.name === "ApiOutcomeUnknownError" &&
            /resultado da gravação é desconhecido/.test(error.message)
    );
});
