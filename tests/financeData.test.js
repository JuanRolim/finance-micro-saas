const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.join(__dirname, "..");
const context = vm.createContext({
    Date,
    Intl,
    Math,
    Number,
    Array,
    Set,
    Map,
    String,
    Object
});

for (const file of ["js/utils.js", "js/modules/financeData.js"]) {
    vm.runInContext(
        fs.readFileSync(path.join(root, file), "utf8"),
        context,
        { filename: file }
    );
}

const records = [
    {
        data: "29/10/2026",
        fluxo: "Saída",
        natureza: "Despesa",
        categoriaNova: "Alimentação",
        subcategoriaNova: "Restaurante",
        essencialidade: "Não essencial",
        comportamento: "Variável",
        valor: 150,
        observacao: "Jantar de aniversário"
    },
    {
        data: "08/10/2026",
        fluxo: "Saída",
        natureza: "Investimento",
        categoriaNova: "Investimentos",
        subcategoriaNova: "Renda fixa",
        valor: 90
    },
    {
        data: "04/10/2026",
        fluxo: "Entrada",
        natureza: "Receita",
        categoriaNova: "Salário",
        valor: 1000
    },
    {
        data: "29/09/2026",
        fluxo: "Saída",
        natureza: "Despesa",
        categoriaNova: "Alimentação",
        subcategoriaNova: "Mercado",
        essencialidade: "",
        comportamento: "",
        valor: 50
    },
    {
        data: "22/10/2026",
        fluxo: "Saída",
        natureza: "Aporte para sonho",
        categoriaNova: "Sonhos",
        subcategoriaNova: "Aporte para meta",
        valor: 25
    }
];

test("parses Brazilian dates and values without timezone shifts", () => {
    const date = context.interpretarDataFinanceira("29/10/2026");
    assert.equal(date.getFullYear(), 2026);
    assert.equal(date.getMonth(), 9);
    assert.equal(date.getDate(), 29);
    assert.equal(context.converterValorFinanceiro("R$ 1.234,56"), 1234.56);
});

test("searches accent-insensitively and accepts Brazilian currency formats", () => {
    for (const query of ["150", "150,00", "R$ 150,00"]) {
        const found = context.filtrarMovimentacoesFinanceiras(records, {
            ...context.criarFiltrosFinanceiros("all"),
            consulta: query
        });
        assert.equal(found.length, 1, query);
        assert.equal(found[0].subcategoriaNova, "Restaurante");
    }

    const textFound = context.filtrarMovimentacoesFinanceiras(records, {
        ...context.criarFiltrosFinanceiros("all"),
        consulta: "ANIVERSARIO"
    });
    assert.equal(textFound.length, 1);
    assert.equal(textFound[0].valor, 150);
});

test("combines period, nature, category, essentiality, behavior, and value filters", () => {
    const filters = {
        ...context.criarFiltrosFinanceiros("custom"),
        dataInicio: "2026-10-01",
        dataFim: "2026-10-31",
        fluxo: "Saída",
        natureza: "Despesa",
        categoria: "Alimentação",
        essencialidade: "Não essencial",
        comportamento: "Variável",
        valorMinimo: "100",
        valorMaximo: "200"
    };
    const found = context.filtrarMovimentacoesFinanceiras(records, filters);
    assert.equal(found.length, 1);
    assert.equal(found[0].valor, 150);
});

test("limits unreported essentiality and behavior filters to consumption expenses", () => {
    const unknownEssentiality = context.filtrarMovimentacoesFinanceiras(records, {
        ...context.criarFiltrosFinanceiros("all"),
        essencialidade: "__nao_informado__"
    });
    const unknownBehavior = context.filtrarMovimentacoesFinanceiras(records, {
        ...context.criarFiltrosFinanceiros("all"),
        comportamento: "__nao_informado__"
    });
    assert.equal(unknownEssentiality.length, 1);
    assert.equal(unknownEssentiality[0].valor, 50);
    assert.equal(unknownBehavior.length, 1);
    assert.equal(unknownBehavior[0].valor, 50);

    const summary = context.resumirMovimentacoesFinanceiras(records);
    assert.equal(summary.entradas, 1000);
    assert.equal(summary.saidas, 315);
    assert.equal(summary.consumo, 200);
    assert.equal(summary.investimentos, 90);
    assert.equal(summary.sonhos, 25);
    assert.equal(summary.saldo, 685);
});

test("sorts recent first by default and respects custom date boundaries", () => {
    const filtered = context.filtrarMovimentacoesFinanceiras(records, {
        ...context.criarFiltrosFinanceiros("custom"),
        dataInicio: "2026-10-01",
        dataFim: "2026-10-31"
    });
    assert.equal(filtered.length, 4);
    assert.equal(filtered[0].data, "29/10/2026");
    assert.equal(filtered[filtered.length - 1].data, "04/10/2026");
});

test("calculates predefined periods against the supplied reference date", () => {
    const reference = new Date(2026, 9, 29);
    const currentMonth = context.obterIntervaloFinanceiro(
        { periodo: "this-month" },
        reference
    );
    assert.equal(currentMonth.inicio.getDate(), 1);
    assert.equal(currentMonth.fim.getDate(), 31);

    const previousMonth = context.obterIntervaloFinanceiro(
        { periodo: "previous-month" },
        reference
    );
    assert.equal(previousMonth.inicio.getMonth(), 8);
    assert.equal(previousMonth.fim.getDate(), 30);
});
