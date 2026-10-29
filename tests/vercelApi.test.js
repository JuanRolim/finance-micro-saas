const { Readable } = require("node:stream");
const test = require("node:test");
const assert = require("node:assert/strict");
const financeApi = require("../api/finance.js");

process.env.APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/test-deployment/exec";
process.env.APPS_SCRIPT_SHARED_SECRET =
    "test-only-shared-secret-with-at-least-thirty-two-bytes";

function criarRequisicao({
    method = "GET",
    path = "/api/finance?acao=historico",
    body = "",
    origin = "https://finance.example.com",
    host = "finance.example.com",
    contentType = "application/x-www-form-urlencoded"
} = {}) {
    const req = Readable.from(method === "POST" ? [Buffer.from(body)] : []);
    req.method = method;
    req.url = path;
    req.headers = {
        host,
        origin,
        "x-forwarded-proto": "https",
        "content-type": contentType
    };
    req.query = Object.fromEntries(
        new URL(path, "https://finance.example.com").searchParams.entries()
    );
    return req;
}

function criarResposta() {
    return {
        headers: {},
        statusCode: 200,
        setHeader(name, value) {
            this.headers[name] = value;
        },
        end(value) {
            this.body = value;
        },
        json() {
            return JSON.parse(this.body);
        }
    };
}

async function executar(req) {
    const res = criarResposta();
    await financeApi(req, res);
    return res;
}

test("forwards allowlisted reads through authenticated POST without URL secrets", async () => {
    const originalFetch = global.fetch;
    let receivedUrl;
    let receivedOptions;
    global.fetch = async (url, options) => {
        receivedUrl = String(url);
        receivedOptions = options;
        return new Response(JSON.stringify([{ valor: 12 }]), { status: 200 });
    };
    try {
        const res = await executar(criarRequisicao());
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.json(), [{ valor: 12 }]);
        assert.match(receivedUrl, /^https:\/\/script\.google\.com\/macros\/s\/test-deployment\/exec$/);
        assert.equal(receivedOptions.method, "POST");
        const upstreamForm = new URLSearchParams(receivedOptions.body);
        assert.equal(upstreamForm.get("acao"), "historico");
        assert.equal(
            upstreamForm.get("_sharedSecret"),
            process.env.APPS_SCRIPT_SHARED_SECRET
        );
        assert.equal(receivedUrl.includes(process.env.APPS_SCRIPT_SHARED_SECRET), false);
        assert.equal(res.headers["Cache-Control"], "no-store");
    } finally {
        global.fetch = originalFetch;
    }
});

test("rejects empty or malformed successful responses for every read action", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response("{}", { status: 200 });
    try {
        for (const acao of [
            "dashboard",
            "historico",
            "subcategorias",
            "configuracoes",
            "metas"
        ]) {
            const res = await executar(criarRequisicao({
                path: `/api/finance?acao=${acao}`
            }));
            assert.equal(res.statusCode, 502, acao);
            assert.match(
                res.json().message,
                /formato|incomplet[oa]s|inválid[oa]s/i,
                acao
            );
        }
    } finally {
        global.fetch = originalFetch;
    }
});

test("accepts a complete dashboard response", async () => {
    const originalFetch = global.fetch;
    const dashboard = {
        entrada: 150,
        saida: 27,
        saldo: 123,
        essencial: 20,
        naoEssencial: 7,
        investimentos: 0,
        sonhos: 0
    };
    global.fetch = async () =>
        new Response(JSON.stringify(dashboard), { status: 200 });
    try {
        const res = await executar(criarRequisicao({
            path: "/api/finance?acao=dashboard"
        }));
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.json(), dashboard);
    } finally {
        global.fetch = originalFetch;
    }
});

test("forwards a validated movement and returns its confirmation", async () => {
    const originalFetch = global.fetch;
    let upstreamRequest;
    global.fetch = async (url, options) => {
        upstreamRequest = { url: String(url), options };
        return new Response(JSON.stringify({
            success: true,
            idMovimentacao: "stable-transaction-id"
        }), { status: 200 });
    };
    const registro = {
        idMovimentacao: "stable-transaction-id",
        fluxo: "Saída",
        natureza: "Despesa",
        categoria: "Alimentação",
        subcategoria: "Mercado",
        valor: 20,
        observacao: "Registro de teste"
    };
    try {
        const res = await executar(criarRequisicao({
            method: "POST",
            path: "/api/finance",
            body: new URLSearchParams({
                registro: JSON.stringify(registro),
                idOperacao: "stable-transaction-id"
            }).toString()
        }));
        assert.equal(res.statusCode, 200);
        assert.equal(res.json().idMovimentacao, "stable-transaction-id");
        assert.equal(upstreamRequest.options.method, "POST");
        assert.equal(
            new URLSearchParams(upstreamRequest.options.body).get("registro"),
            JSON.stringify(registro)
        );
        assert.equal(
            new URLSearchParams(upstreamRequest.options.body).get("idOperacao"),
            "stable-transaction-id"
        );
        assert.equal(
            new URLSearchParams(upstreamRequest.options.body).get("_sharedSecret"),
            process.env.APPS_SCRIPT_SHARED_SECRET
        );
        assert.match(upstreamRequest.url, /\/exec$/);
    } finally {
        global.fetch = originalFetch;
    }
});

test("rejects opaque, cross-origin, and non-allowlisted requests without forwarding", async () => {
    const originalFetch = global.fetch;
    let calls = 0;
    global.fetch = async () => {
        calls += 1;
        return new Response("{}", { status: 200 });
    };
    try {
        const opaque = await executar(criarRequisicao({ origin: "null" }));
        const crossOrigin = await executar(criarRequisicao({
            origin: "https://attacker.example"
        }));
        const arbitraryAction = await executar(criarRequisicao({
            path: "/api/finance?acao=proxy&url=https%3A%2F%2Fattacker.example"
        }));
        assert.equal(opaque.statusCode, 403);
        assert.equal(crossOrigin.statusCode, 403);
        assert.equal(arbitraryAction.statusCode, 400);
        assert.equal(calls, 0);
    } finally {
        global.fetch = originalFetch;
    }
});

test("rejects movement submissions without a stable id before forwarding", async () => {
    const originalFetch = global.fetch;
    let calls = 0;
    global.fetch = async () => {
        calls += 1;
        return new Response("{}", { status: 200 });
    };
    try {
        const res = await executar(criarRequisicao({
            method: "POST",
            path: "/api/finance",
            body: new URLSearchParams({
                registro: JSON.stringify({ valor: 20 }),
                idOperacao: "stable-operation-id"
            }).toString()
        }));
        assert.equal(res.statusCode, 400);
        assert.match(res.json().message, /identificador estável/);
        assert.equal(calls, 0);
    } finally {
        global.fetch = originalFetch;
    }
});

test("rejects writes without an idempotency key before forwarding", async () => {
    const originalFetch = global.fetch;
    let calls = 0;
    global.fetch = async () => {
        calls += 1;
        return new Response("{}", { status: 200 });
    };
    try {
        const res = await executar(criarRequisicao({
            method: "POST",
            path: "/api/finance",
            body: new URLSearchParams({
                acao: "criarMeta",
                meta: JSON.stringify({ nome: "Teste", valorMeta: 100 })
            }).toString()
        }));
        assert.equal(res.statusCode, 400);
        assert.match(res.json().message, /identificador estável/);
        assert.equal(calls, 0);
    } finally {
        global.fetch = originalFetch;
    }
});

test("does not accept an Apps Script secret from the browser request", async () => {
    const originalFetch = global.fetch;
    let calls = 0;
    global.fetch = async () => {
        calls += 1;
        return new Response("{}", { status: 200 });
    };
    try {
        const res = await executar(criarRequisicao({
            method: "POST",
            path: "/api/finance",
            body: new URLSearchParams({
                acao: "encerrarMeta",
                idMeta: "M001",
                idOperacao: "close-meta-operation-001",
                _sharedSecret: process.env.APPS_SCRIPT_SHARED_SECRET
            }).toString()
        }));
        assert.equal(res.statusCode, 400);
        assert.match(res.json().message, /parâmetros não permitidos/);
        assert.equal(calls, 0);
    } finally {
        global.fetch = originalFetch;
    }
});

test("fails closed when the server-to-server secret is missing", async () => {
    const originalFetch = global.fetch;
    const originalSecret = process.env.APPS_SCRIPT_SHARED_SECRET;
    let calls = 0;
    delete process.env.APPS_SCRIPT_SHARED_SECRET;
    global.fetch = async () => {
        calls += 1;
        return new Response("{}", { status: 200 });
    };
    try {
        const res = await executar(criarRequisicao());
        assert.equal(res.statusCode, 502);
        assert.match(res.json().message, /credencial privada/);
        assert.equal(res.body.includes(originalSecret), false);
        assert.equal(calls, 0);
    } finally {
        process.env.APPS_SCRIPT_SHARED_SECRET = originalSecret;
        global.fetch = originalFetch;
    }
});

test("preserves an Apps Script uncertain-outcome marker for writes", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(JSON.stringify({
        success: false,
        outcomeUnknown: true,
        message: "O Apps Script não confirmou a operação."
    }), { status: 200 });
    try {
        const res = await executar(criarRequisicao({
            method: "POST",
            path: "/api/finance",
            body: new URLSearchParams({
                acao: "criarMeta",
                meta: JSON.stringify({ nome: "Teste", valorMeta: 100 }),
                idOperacao: "create-meta-operation-001"
            }).toString()
        }));
        assert.equal(res.statusCode, 502);
        assert.equal(res.json().outcomeUnknown, true);
    } finally {
        global.fetch = originalFetch;
    }
});

test("treats a non-success upstream HTTP status as an uncertain write", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(
        JSON.stringify({ success: false, message: "Internal failure." }),
        { status: 500 }
    );
    try {
        const res = await executar(criarRequisicao({
            method: "POST",
            path: "/api/finance",
            body: new URLSearchParams({
                acao: "criarMeta",
                meta: JSON.stringify({ nome: "Teste", valorMeta: 100 }),
                idOperacao: "create-meta-operation-002"
            }).toString()
        }));
        assert.equal(res.statusCode, 502);
        assert.equal(res.json().outcomeUnknown, true);
    } finally {
        global.fetch = originalFetch;
    }
});

test("reports an upstream timeout as an unknown write outcome", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => {
        const error = new Error("timeout");
        error.name = "TimeoutError";
        throw error;
    };
    try {
        const res = await executar(criarRequisicao({
            method: "POST",
            path: "/api/finance",
            body: new URLSearchParams({
                registro: JSON.stringify({ idMovimentacao: "stable-id" }),
                idOperacao: "stable-id"
            }).toString()
        }));
        assert.equal(res.statusCode, 504);
        assert.equal(res.json().outcomeUnknown, true);
    } finally {
        global.fetch = originalFetch;
    }
});

test("marks malformed upstream JSON as uncertain for writes", async () => {
    const originalFetch = global.fetch;
    let calls = 0;
    global.fetch = async () => {
        calls += 1;
        return calls === 1
            ? new Response("<html>error</html>", { status: 200 })
            : new Response("[]", { status: 200 });
    };
    try {
        const res = await executar(criarRequisicao({
            method: "POST",
            path: "/api/finance",
            body: new URLSearchParams({
                registro: JSON.stringify({ idMovimentacao: "stable-id" }),
                idOperacao: "stable-id"
            }).toString()
        }));
        assert.equal(res.statusCode, 502);
        assert.equal(res.json().outcomeUnknown, true);
        assert.equal(calls, 2);
    } finally {
        global.fetch = originalFetch;
    }
});

test("confirms a movement from history when the Apps Script write response is malformed", async () => {
    const originalFetch = global.fetch;
    const idMovimentacao = "movement-recovery-operation-001";
    let calls = 0;
    global.fetch = async (_url, options) => {
        calls += 1;
        if (calls === 1) {
            return new Response("", { status: 200 });
        }

        const form = new URLSearchParams(options.body);
        assert.equal(form.get("acao"), "historico");
        assert.equal(
            form.get("_sharedSecret"),
            process.env.APPS_SCRIPT_SHARED_SECRET
        );
        return new Response(JSON.stringify([{
            idMovimentacao,
            valor: 35
        }]), { status: 200 });
    };
    try {
        const res = await executar(criarRequisicao({
            method: "POST",
            path: "/api/finance",
            body: new URLSearchParams({
                registro: JSON.stringify({ idMovimentacao }),
                idOperacao: idMovimentacao
            }).toString()
        }));

        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.json(), {
            success: true,
            idMovimentacao,
            confirmadaNoHistorico: true
        });
        assert.equal(calls, 2);
    } finally {
        global.fetch = originalFetch;
    }
});
