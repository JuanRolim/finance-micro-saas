const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const assert = require("node:assert/strict");

const source = fs.readFileSync(
    path.join(__dirname, "..", "js", "modules", "transaction.js"),
    "utf8"
);

function criarContexto() {
    const button = { disabled: false, textContent: "Salvar movimentação" };
    const observation = { value: "Nota preservada" };
    const payment = { value: "Pix" };
    const app = { innerHTML: "" };
    const context = vm.createContext({
        Date,
        Math,
        Number,
        String,
        Array,
        Set,
        Map,
        console: { error() {} },
        alert() {},
        document: {
            getElementById(id) {
                if (id === "btnSalvar") return button;
                if (id === "observacao") return observation;
                if (id === "pagamento") return payment;
                if (id === "btnIrDashboard") {
                    return { addEventListener() {} };
                }
                return null;
            }
        },
        app,
        gerarIdUnico: () => "stable-base-id",
        invalidarHistorico() {},
        invalidarAnalise() {}
    });
    vm.runInContext(source, context, { filename: "js/modules/transaction.js" });
    vm.runInContext(`
        Object.assign(registroAtual, {
            fluxo: "Saída",
            natureza: "Despesa",
            categoria: "Alimentação",
            subcategoria: "Mercado",
            valor: 100,
            essencialidade: "Essencial",
            comportamento: "Variável",
            idMovimentacao: "stable-base-id"
        });
        etapaAtual = ETAPAS.RESUMO;
    `, context);
    return { context, button, observation, app };
}

test("checks history before retrying and completes when the ambiguous save exists", async () => {
    const { context, button, observation, app } = criarContexto();
    let saves = 0;
    let historyChecks = 0;
    context.salvarNaPlanilha = async () => {
        saves += 1;
        const error = new Error("response lost");
        error.name = "ApiOutcomeUnknownError";
        throw error;
    };
    context.obterHistorico = async () => {
        historyChecks += 1;
        return [{ idMovimentacao: "stable-base-id", valor: 100 }];
    };

    await context.finalizarRegistro();
    assert.equal(button.textContent, "Verificar e tentar novamente");
    assert.equal(observation.value, "Nota preservada");
    assert.equal(saves, 1);
    assert.equal(historyChecks, 0);

    await context.finalizarRegistro();
    assert.equal(historyChecks, 1);
    assert.equal(saves, 1);
    assert.match(app.innerHTML, /Movimentação salva com sucesso/);
});

test("retries a movement id found in history when its stored amount is missing", async () => {
    const { context, button, app } = criarContexto();
    let saves = 0;
    context.salvarNaPlanilha = async () => {
        saves += 1;
        if (saves === 1) {
            const error = new Error("partial write");
            error.name = "ApiOutcomeUnknownError";
            throw error;
        }
        return { success: true };
    };
    context.obterHistorico = async () => [{
        idMovimentacao: "stable-base-id",
        valor: 0
    }];

    await context.finalizarRegistro();
    await context.finalizarRegistro();

    assert.equal(saves, 2);
    assert.match(app.innerHTML, /Movimentação salva com sucesso/);
    assert.notEqual(button.textContent, "Verificar e tentar novamente");
});

test("retries only missing installments after confirming which ids reached history", async () => {
    const { context, button, app } = criarContexto();
    vm.runInContext(`
        registroAtual.parcelado = true;
        registroAtual.quantidadeParcelas = 2;
        registroAtual.data = new Date(2026, 0, 31);
    `, context);
    const sentIds = [];
    context.salvarNaPlanilha = async (item) => {
        sentIds.push(item.idMovimentacao);
        if (sentIds.length === 2) {
            const error = new Error("response lost");
            error.name = "ApiOutcomeUnknownError";
            throw error;
        }
        return { success: true };
    };
    context.obterHistorico = async () => [{
        idMovimentacao: "stable-base-id-P01",
        valor: 50
    }];

    await context.finalizarRegistro();
    assert.equal(button.textContent, "Verificar e tentar novamente");
    await context.finalizarRegistro();

    assert.deepEqual(sentIds, [
        "stable-base-id-P01",
        "stable-base-id-P02",
        "stable-base-id-P02"
    ]);
    assert.match(app.innerHTML, /Movimentação salva com sucesso/);
});

test("does not resend when history verification itself fails", async () => {
    const { context, button } = criarContexto();
    let saves = 0;
    let checks = 0;
    context.salvarNaPlanilha = async () => {
        saves += 1;
        const error = new Error("write response lost");
        error.name = "ApiOutcomeUnknownError";
        throw error;
    };
    context.obterHistorico = async () => {
        checks += 1;
        if (checks === 1) throw new Error("history unavailable");
        return [];
    };

    await context.finalizarRegistro();
    await context.finalizarRegistro();

    assert.equal(checks, 1);
    assert.equal(saves, 1);
    assert.equal(button.textContent, "Verificar e tentar novamente");
});
