const PERIODOS_FINANCEIROS = [
    { value: "this-month", label: "Este mês" },
    { value: "previous-month", label: "Mês anterior" },
    { value: "last-30-days", label: "Últimos 30 dias" },
    { value: "last-3-months", label: "Últimos 3 meses" },
    { value: "current-year", label: "Ano atual" },
    { value: "custom", label: "Personalizado" },
    { value: "all", label: "Todo o histórico" }
];

function criarFiltrosFinanceiros(periodo, sobrescritos = {}) {
    return {
        periodo: periodo || "this-month",
        dataInicio: "",
        dataFim: "",
        fluxo: "",
        natureza: "",
        categoria: "",
        subcategoria: "",
        essencialidade: "",
        comportamento: "",
        valorMinimo: "",
        valorMaximo: "",
        consulta: "",
        ordenacao: "recentes",
        ...sobrescritos
    };
}

function normalizarPesquisaFinanceira(valor) {
    return String(valor == null ? "" : valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .trim();
}

function interpretarDataFinanceira(valor) {
    if (valor instanceof Date && !isNaN(valor.getTime())) {
        return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
    }

    const texto = String(valor == null ? "" : valor).trim();
    let partes;
    if ((partes = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) {
        return new Date(Number(partes[3]), Number(partes[2]) - 1, Number(partes[1]));
    }
    if ((partes = texto.match(/^(\d{4})-(\d{2})-(\d{2})/))) {
        return new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
    }

    const data = new Date(texto);
    if (isNaN(data.getTime())) return null;
    return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function converterValorFinanceiro(valor) {
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
    const texto = String(valor == null ? "" : valor)
        .replace(/[R$\s]/g, "")
        .trim();
    if (!texto) return 0;
    const normalizado = texto.includes(",")
        ? texto.replace(/\./g, "").replace(",", ".")
        : texto;
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
}

function interpretarBuscaValor(valor) {
    const texto = String(valor || "")
        .replace(/R\$/gi, "")
        .replace(/\s/g, "")
        .trim();
    if (!texto || !/^[+-]?\d[\d.,]*$/.test(texto)) return null;

    let normalizado = texto;
    if (normalizado.includes(",") && normalizado.includes(".")) {
        normalizado = normalizado.replace(/\./g, "").replace(",", ".");
    } else if (normalizado.includes(",")) {
        normalizado = normalizado.replace(",", ".");
    } else if (/^[+-]?\d{1,3}(\.\d{3})+$/.test(normalizado)) {
        normalizado = normalizado.replace(/\./g, "");
    }
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? Math.round(numero * 100) : null;
}

function obterIntervaloFinanceiro(filtros, referencia = new Date()) {
    const ano = referencia.getFullYear();
    const mes = referencia.getMonth();
    const inicioMesAtual = new Date(ano, mes, 1);
    const fimHoje = new Date(ano, mes, referencia.getDate());

    switch (filtros.periodo) {
        case "this-month":
            return { inicio: inicioMesAtual, fim: new Date(ano, mes + 1, 0) };
        case "previous-month":
            return { inicio: new Date(ano, mes - 1, 1), fim: new Date(ano, mes, 0) };
        case "last-30-days": {
            const inicio = new Date(fimHoje);
            inicio.setDate(inicio.getDate() - 29);
            return { inicio, fim: fimHoje };
        }
        case "last-3-months":
            return { inicio: new Date(ano, mes - 2, 1), fim: fimHoje };
        case "current-year":
            return { inicio: new Date(ano, 0, 1), fim: new Date(ano, 11, 31) };
        case "custom":
            return {
                inicio: interpretarDataFinanceira(filtros.dataInicio),
                fim: interpretarDataFinanceira(filtros.dataFim)
            };
        case "all":
            return { inicio: null, fim: null };
        default:
            return { inicio: inicioMesAtual, fim: new Date(ano, mes + 1, 0) };
    }
}

function obterFluxoMovimentacao(item) {
    if (item.fluxo) return item.fluxo;
    return normalizarPesquisaFinanceira(item.tipo) === "entrada" ||
        normalizarPesquisaFinanceira(item.tipo) === "receita"
        ? "Entrada"
        : "Saída";
}

function obterNaturezaMovimentacao(item) {
    if (item.natureza) return item.natureza;
    if (normalizarPesquisaFinanceira(item.tipo) === "entrada") return "Receita";
    return "";
}

function obterCategoriaMovimentacao(item) {
    return item.categoriaNova || item.categoria || item.categoriaLegada || "";
}

function filtrarMovimentacoesFinanceiras(movimentacoes, filtros, referencia = new Date()) {
    const intervalo = obterIntervaloFinanceiro(filtros, referencia);
    const busca = normalizarPesquisaFinanceira(filtros.consulta);
    const valorBusca = interpretarBuscaValor(filtros.consulta);
    const minimo = filtros.valorMinimo === "" ? null : converterValorFinanceiro(filtros.valorMinimo);
    const maximo = filtros.valorMaximo === "" ? null : converterValorFinanceiro(filtros.valorMaximo);

    const resultado = (movimentacoes || []).filter((item) => {
        const data = interpretarDataFinanceira(item.data);
        const valor = converterValorFinanceiro(item.valor);
        const fluxo = obterFluxoMovimentacao(item);
        const natureza = obterNaturezaMovimentacao(item);
        const categoria = obterCategoriaMovimentacao(item);
        const subcategoria = item.subcategoriaNova || item.subcategoria || "";

        if (intervalo.inicio && (!data || data < intervalo.inicio)) return false;
        if (intervalo.fim && (!data || data > intervalo.fim)) return false;
        if (filtros.fluxo && normalizarPesquisaFinanceira(fluxo) !== normalizarPesquisaFinanceira(filtros.fluxo)) return false;
        if (filtros.natureza && normalizarPesquisaFinanceira(natureza) !== normalizarPesquisaFinanceira(filtros.natureza)) return false;
        if (filtros.categoria && normalizarPesquisaFinanceira(categoria) !== normalizarPesquisaFinanceira(filtros.categoria)) return false;
        if (filtros.subcategoria && normalizarPesquisaFinanceira(subcategoria) !== normalizarPesquisaFinanceira(filtros.subcategoria)) return false;
        const ehDespesaDeConsumo = normalizarPesquisaFinanceira(natureza) === "despesa";
        if (filtros.essencialidade === "__nao_informado__" &&
            (!ehDespesaDeConsumo || item.essencialidade)) return false;
        if (filtros.essencialidade && filtros.essencialidade !== "__nao_informado__" &&
            normalizarPesquisaFinanceira(item.essencialidade) !== normalizarPesquisaFinanceira(filtros.essencialidade)) return false;
        if (filtros.comportamento === "__nao_informado__" &&
            (!ehDespesaDeConsumo || item.comportamento)) return false;
        if (filtros.comportamento && filtros.comportamento !== "__nao_informado__" &&
            normalizarPesquisaFinanceira(item.comportamento) !== normalizarPesquisaFinanceira(filtros.comportamento)) return false;
        if (minimo !== null && valor < minimo) return false;
        if (maximo !== null && valor > maximo) return false;

        if (busca) {
            const conteudo = normalizarPesquisaFinanceira([
                fluxo, natureza, categoria, subcategoria, item.observacao,
                item.essencialidade, item.comportamento, item.pagamento,
                item.idMeta, item.parcelado ? `${item.quantidadeParcelas}x` : ""
            ].join(" "));
            const valorCorrespondente = valorBusca !== null &&
                Math.round(valor * 100) === Math.abs(valorBusca);
            if (!conteudo.includes(busca) && !valorCorrespondente) return false;
        }
        return true;
    });

    resultado.sort((a, b) => {
        const dataA = interpretarDataFinanceira(a.data);
        const dataB = interpretarDataFinanceira(b.data);
        const diff = (dataA ? dataA.getTime() : 0) - (dataB ? dataB.getTime() : 0);
        if (filtros.ordenacao === "antigos") return diff;
        if (filtros.ordenacao === "maior-valor") return converterValorFinanceiro(b.valor) - converterValorFinanceiro(a.valor);
        if (filtros.ordenacao === "menor-valor") return converterValorFinanceiro(a.valor) - converterValorFinanceiro(b.valor);
        return -diff;
    });
    return resultado;
}

function resumirMovimentacoesFinanceiras(movimentacoes) {
    const resumo = {
        quantidade: (movimentacoes || []).length,
        entradas: 0,
        saidas: 0,
        consumo: 0,
        investimentos: 0,
        sonhos: 0,
        despesasEssenciais: 0,
        despesasNaoEssenciais: 0,
        despesasFixas: 0,
        despesasVariaveis: 0,
        despesasPeriodicas: 0
    };

    (movimentacoes || []).forEach((item) => {
        const valor = converterValorFinanceiro(item.valor);
        const fluxo = normalizarPesquisaFinanceira(obterFluxoMovimentacao(item));
        const natureza = normalizarPesquisaFinanceira(obterNaturezaMovimentacao(item));
        const essencialidade = normalizarPesquisaFinanceira(item.essencialidade);
        const comportamento = normalizarPesquisaFinanceira(item.comportamento);

        if (fluxo === "entrada") resumo.entradas += valor;
        if (fluxo === "saida") resumo.saidas += valor;
        if (natureza === "despesa") {
            resumo.consumo += valor;
            if (essencialidade === "essencial") resumo.despesasEssenciais += valor;
            if (essencialidade === "nao essencial") resumo.despesasNaoEssenciais += valor;
            if (comportamento === "fixo") resumo.despesasFixas += valor;
            if (comportamento === "variavel") resumo.despesasVariaveis += valor;
            if (comportamento === "periodico") resumo.despesasPeriodicas += valor;
        }
        if (natureza === "investimento") resumo.investimentos += valor;
        if (natureza === "aporte para sonho") resumo.sonhos += valor;
    });
    resumo.saldo = resumo.entradas - resumo.saidas;
    return resumo;
}

function agregarMovimentacoes(movimentacoes, campo) {
    const mapa = new Map();
    (movimentacoes || []).forEach((item) => {
        const chave = campo === "categoria"
            ? obterCategoriaMovimentacao(item) || "Não informado"
            : item[campo] || "Não informado";
        mapa.set(chave, (mapa.get(chave) || 0) + converterValorFinanceiro(item.valor));
    });
    return Array.from(mapa.entries())
        .map(([nome, valor]) => ({ nome, valor }))
        .sort((a, b) => b.valor - a.valor);
}

function formatarDataInputFinanceira(data) {
    if (!data) return "";
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function escaparAtributoFinanceiro(valor) {
    return escaparHtml(valor);
}

function renderSelectFinanceiro(id, label, opcoes, atual, valueKey = "value", labelKey = "label") {
    return `
        <label for="${id}">${label}
            <select id="${id}">
                ${opcoes.map((opcao) => `
                    <option value="${escaparHtml(opcao[valueKey])}"
                        ${String(opcao[valueKey]) === String(atual) ? "selected" : ""}>
                        ${escaparHtml(opcao[labelKey])}
                    </option>
                `).join("")}
            </select>
        </label>
    `;
}
