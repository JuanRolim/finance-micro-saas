const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const assert = require("node:assert/strict");

const source = fs.readFileSync(
    path.join(__dirname, "..", "apps script.txt"),
    "utf8"
);

class FakeSheet {
    constructor(name, rows = 50, columns = 40) {
        this.name = name;
        this.values = Array.from({ length: rows }, () => Array(columns).fill(""));
    }

    getName() {
        return this.name;
    }

    getLastRow() {
        for (let row = this.values.length - 1; row >= 0; row -= 1) {
            if (this.values[row].some((value) => value !== "" && value != null)) {
                return row + 1;
            }
        }
        return 0;
    }

    getMaxColumns() {
        return this.values[0].length;
    }

    getRange(row, column, rowCount = 1, columnCount = 1) {
        const sheet = this;
        return {
            getDisplayValues() {
                return Array.from({ length: rowCount }, (_, rowOffset) =>
                    Array.from({ length: columnCount }, (_, columnOffset) => {
                        const value = sheet.values[row + rowOffset - 1][column + columnOffset - 1];
                        return value == null ? "" : String(value);
                    })
                );
            },
            getValues() {
                return Array.from({ length: rowCount }, (_, rowOffset) =>
                    Array.from({ length: columnCount }, (_, columnOffset) =>
                        sheet.values[row + rowOffset - 1][column + columnOffset - 1]
                    )
                );
            },
            getDisplayValue() {
                const value = sheet.values[row - 1][column - 1];
                return value == null ? "" : String(value);
            },
            getValue() {
                return sheet.values[row - 1][column - 1];
            },
            setValue(value) {
                sheet.values[row - 1][column - 1] = value;
            },
            setValues(values) {
                values.forEach((valuesRow, rowOffset) =>
                    valuesRow.forEach((value, columnOffset) => {
                        sheet.values[row + rowOffset - 1][column + columnOffset - 1] = value;
                    })
                );
            }
        };
    }
}

function criarContexto() {
    const secretProperties = { APPS_SCRIPT_SHARED_SECRET: "test-shared-secret-with-32-chars-min" };
    const context = vm.createContext({
        Date,
        Math,
        Number,
        String,
        Array,
        Object,
        Set,
        Map,
        JSON,
        Logger: { log() {} },
        PropertiesService: {
            getScriptProperties: () => ({
                getProperty: (key) => secretProperties[key] || ""
            })
        },
        ContentService: {
            MimeType: { JSON: "application/json" },
            createTextOutput: (text) => ({
                text,
                setMimeType() { return this; }
            })
        },
        Utilities: { getUuid: () => "generated-id" },
        LockService: {
            getScriptLock: () => ({
                waitLock() {},
                releaseLock() {}
            })
        }
    });
    vm.runInContext(source, context, { filename: "apps script.txt" });
    context.__secretProperties = secretProperties;
    vm.runInContext(
        "globalThis.__monthlyHeaders = CABECALHOS_CLASSIFICACAO;",
        context
    );
    context.garantirResumoClassificacao = () => {};
    return context;
}

test("rejects direct unauthenticated Apps Script requests", () => {
    const context = criarContexto();
    const deniedPost = context.doPost({ parameter: { acao: "dashboard" } });
    const deniedGet = context.doGet({ parameter: { acao: "dashboard" } });

    assert.deepEqual(JSON.parse(deniedPost.text), {
        success: false,
        message: "Não autorizado."
    });
    assert.match(JSON.parse(deniedGet.text).message, /Não autorizado/);
});

test("accepts authenticated reads only through POST", () => {
    const context = criarContexto();
    context.obterDashboard = () => ({ saldo: 123 });

    const response = context.doPost({
        parameter: {
            _sharedSecret: context.__secretProperties.APPS_SCRIPT_SHARED_SECRET,
            acao: "dashboard"
        }
    });

    assert.deepEqual(JSON.parse(response.text), { saldo: 123 });
});

test("creates a meta idempotently using the persisted operation id", () => {
    const context = criarContexto();
    const sheet = new FakeSheet("METAS");
    const spreadsheet = { getSheetByName: () => sheet };
    context.SpreadsheetApp = { openById: () => spreadsheet };
    const meta = {
        nome: "Meta teste",
        valorMeta: 250,
        tipo: "ATIVA",
        prioridade: "MÉDIA"
    };

    const first = context.criarMeta(meta, "operation-test-001");
    const second = context.criarMeta(meta, "operation-test-001");

    assert.equal(first.idMeta, "M001");
    assert.equal(second.idMeta, first.idMeta);
    assert.equal(second.duplicadoIgnorado, true);
    assert.equal(sheet.getLastRow(), 2);
    assert.equal(sheet.getRange(2, 9).getValue(), "operation-test-001");
});

test("extends the old monthly schema only when new columns are empty", () => {
    const context = criarContexto();
    const sheet = new FakeSheet("OUTUBRO/2026");
    const prefix = context.__monthlyHeaders.slice(0, 11);
    sheet.getRange(1, 24, 1, prefix.length).setValues([prefix]);
    sheet.getRange(2, 1).setValue(new Date(2026, 9, 1));

    context.garantirEstruturaAbaMensal(sheet);

    const finalHeaders = sheet.getRange(1, 24, 1, 13).getDisplayValues()[0];
    assert.deepEqual(finalHeaders.slice(11), [
        "QUANTIDADE_PARCELAS_V2",
        "NUMERO_PARCELA_V2"
    ]);
    assert.equal(sheet.getRange(2, 1).getValue().getFullYear(), 2026);
});

test("refuses schema migration if any unheaded extension column contains data", () => {
    const context = criarContexto();
    const sheet = new FakeSheet("OUTUBRO/2026");
    sheet.getRange(1, 24, 1, 11)
        .setValues([context.__monthlyHeaders.slice(0, 11)]);
    sheet.getRange(2, 35).setValue("preserve-me");

    assert.throws(
        () => context.garantirEstruturaAbaMensal(sheet),
        /novas colunas contêm dados/
    );
    assert.equal(sheet.getRange(2, 35).getValue(), "preserve-me");
});

test("retries a movement with the same id by repairing the existing row", () => {
    const context = criarContexto();
    const sheet = new FakeSheet("OUTUBRO/2026");
    const monthlyHeaders = Array(36).fill("");
    context.__monthlyHeaders.forEach((header, index) => {
        monthlyHeaders[23 + index] = header;
    });
    sheet.getRange(1, 1, 1, monthlyHeaders.length).setValues([monthlyHeaders]);

    const spreadsheet = {
        getSheetByName: () => sheet
    };
    context.SpreadsheetApp = { openById: () => spreadsheet };
    context.obterConfiguracaoClassificacao = () => ({});
    context.normalizarMovimentacao = (record) => ({
        data: new Date(2026, 9, 4),
        idMovimentacao: record.idMovimentacao,
        idMeta: "",
        pagamento: "À vista",
        valor: record.valor,
        observacao: record.observacao,
        parcelado: false,
        quantidadeParcelas: 1,
        numeroParcela: 1,
        classificacao: {
            fluxo: "Saída",
            natureza: "Despesa",
            categoria: "Alimentação",
            subcategoria: "Mercado",
            essencialidade: "Essencial",
            comportamento: "Variável",
            status: "CLASSIFICADO"
        }
    });
    context.obterNomeAbaMes = () => sheet;
    context.obterUltimaLinhaMovimentacoes = (aba) => aba.getLastRow();

    const first = context.salvarMovimentacao({
        idMovimentacao: "fixed-id",
        valor: 100,
        observacao: "Primeira tentativa"
    });
    const retry = context.salvarMovimentacao({
        idMovimentacao: "fixed-id",
        valor: 125,
        observacao: "Repetição corrigida"
    });

    assert.equal(first.success, true);
    assert.equal(retry.success, true);
    assert.equal(retry.duplicadoIgnorado, true);
    assert.equal(sheet.getLastRow(), 2);
    assert.equal(sheet.getRange(2, 6).getValue(), 125);
    assert.equal(sheet.getRange(2, 30).getValue(), "fixed-id");
});

test("retries category and subcategory creation idempotently", () => {
    const context = criarContexto();
    const sheet = new FakeSheet("CATEGORIASCONFIGS");
    const configHeaders = [
        "FLUXO", "NATUREZA", "CATEGORIA", "SUBCATEGORIA",
        "ESSENCIALIDADE", "COMPORTAMENTO"
    ];
    const legacyHeaders = [
        "CATEGORIA_LEGADA", "FLUXO", "NATUREZA",
        "ESSENCIALIDADE", "OBSERVACAO_MIGRACAO"
    ];
    sheet.getRange(1, 13, 1, 6).setValues([configHeaders]);
    sheet.getRange(1, 20, 1, 5).setValues([legacyHeaders]);
    sheet.getRange(2, 13, 1, 6).setValues([
        ["Entrada", "Receita", "Salário", "", "", ""]
    ]);
    sheet.getRange(2, 20, 1, 5).setValues([
        ["Salário", "Entrada", "Receita", "", "Categoria existente"]
    ]);

    const spreadsheet = {
        getSheetByName: (name) => name === "CATEGORIASCONFIGS" ? sheet : null
    };
    context.SpreadsheetApp = { openById: () => spreadsheet };
    context.garantirConfiguracaoClassificacao = () => sheet;

    const criada = context.gerenciarClassificacao({
        operacao: "criar-categoria",
        fluxo: "Entrada",
        natureza: "Receita",
        categoria: "Freelance"
    }, "classification-create-category-001");
    assert.equal(criada.success, true);
    assert.equal(
        criada.classificacoes.some((item) => item.categoria === "Freelance"),
        true
    );

    const repetida = context.gerenciarClassificacao({
        operacao: "criar-categoria",
        fluxo: "Entrada",
        natureza: "Receita",
        categoria: "Freelance"
    }, "classification-create-category-001");
    assert.equal(repetida.success, true);
    assert.equal(repetida.duplicadoIgnorado, true);
    assert.equal(sheet.getRange(3, 19).getValue(), "classification-create-category-001");
    assert.throws(() => context.gerenciarClassificacao({
        operacao: "criar-categoria",
        fluxo: "Entrada",
        natureza: "Receita",
        categoria: "Freelance"
    }, "classification-create-category-002"), /já existe/);

    const subcategoria = context.gerenciarClassificacao({
        operacao: "adicionar-subcategoria",
        fluxo: "Entrada",
        natureza: "Receita",
        categoria: "Freelance",
        subcategoria: "Consultoria"
    }, "classification-add-subcategory-001");
    assert.equal(
        subcategoria.classificacoes.some((item) =>
            item.categoria === "Freelance" && item.subcategoria === "Consultoria"
        ),
        true
    );
    const subcategoriaRepetida = context.gerenciarClassificacao({
        operacao: "adicionar-subcategoria",
        fluxo: "Entrada",
        natureza: "Receita",
        categoria: "Freelance",
        subcategoria: "Consultoria"
    }, "classification-add-subcategory-001");
    assert.equal(subcategoriaRepetida.success, true);
    assert.equal(subcategoriaRepetida.duplicadoIgnorado, true);
    assert.equal(sheet.getRange(4, 19).getValue(), "classification-add-subcategory-001");
    assert.throws(() => context.gerenciarClassificacao({
        operacao: "adicionar-subcategoria",
        fluxo: "Entrada",
        natureza: "Receita",
        categoria: "Freelance",
        subcategoria: "Consultoria"
    }, "classification-add-subcategory-002"), /já existe/);

    const renomeada = context.gerenciarClassificacao({
        operacao: "renomear-categoria",
        fluxo: "Entrada",
        natureza: "Receita",
        categoria: "Freelance",
        novaCategoria: "Serviços"
    }, "classification-rename-category-001");
    const renomeadaRepetida = context.gerenciarClassificacao({
        operacao: "renomear-categoria",
        fluxo: "Entrada",
        natureza: "Receita",
        categoria: "Freelance",
        novaCategoria: "Serviços"
    }, "classification-rename-category-001");
    assert.equal(renomeada.success, true);
    assert.equal(renomeadaRepetida.success, true);
    assert.equal(
        renomeadaRepetida.classificacoes.some((item) =>
            item.categoria === "Serviços" && item.subcategoria === "Consultoria"
        ),
        true
    );

    const subcategoriaRenomeada = context.gerenciarClassificacao({
        operacao: "renomear-subcategoria",
        fluxo: "Entrada",
        natureza: "Receita",
        categoria: "Serviços",
        subcategoria: "Consultoria",
        novaSubcategoria: "Consultoria Premium"
    }, "classification-rename-subcategory-001");
    const subcategoriaRenomeadaRepetida = context.gerenciarClassificacao({
        operacao: "renomear-subcategoria",
        fluxo: "Entrada",
        natureza: "Receita",
        categoria: "Serviços",
        subcategoria: "Consultoria",
        novaSubcategoria: "Consultoria Premium"
    }, "classification-rename-subcategory-001");
    assert.equal(subcategoriaRenomeada.success, true);
    assert.equal(subcategoriaRenomeadaRepetida.success, true);
});

test("renames a classification in both legacy and current monthly columns", () => {
    const context = criarContexto();
    const monthly = new FakeSheet("OUTUBRO2026");
    monthly.getRange(2, 1).setValue(new Date(2026, 9, 15));
    monthly.getRange(2, 4).setValue("Alimentação");
    monthly.getRange(2, 5).setValue("Mercado");
    monthly.getRange(2, 24).setValue("Saída");
    monthly.getRange(2, 25).setValue("Despesa");
    monthly.getRange(2, 26).setValue("Alimentação");
    monthly.getRange(2, 27).setValue("Mercado");

    const spreadsheet = {
        getSheetByName: (name) => name === "OUTUBRO2026" ? monthly : null
    };
    context.obterUltimaLinhaMovimentacoes = () => 2;
    context.atualizarNomeClassificacaoHistorica(
        spreadsheet, "Saída", "Despesa", "Alimentação", "Comida", "", ""
    );
    context.atualizarNomeClassificacaoHistorica(
        spreadsheet, "Saída", "Despesa", "Comida", "Comida", "Mercado", "Supermercado"
    );

    assert.equal(monthly.getRange(2, 4).getValue(), "Comida");
    assert.equal(monthly.getRange(2, 26).getValue(), "Comida");
    assert.equal(monthly.getRange(2, 5).getValue(), "Supermercado");
    assert.equal(monthly.getRange(2, 27).getValue(), "Supermercado");
});
