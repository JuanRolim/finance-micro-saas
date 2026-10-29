let movimentacoesAnalise = null;
let filtrosAnalise = criarFiltrosFinanceiros("current-year");
let erroAnalise = "";

function invalidarAnalise() {
    movimentacoesAnalise = null;
    erroAnalise = "";
}

function renderAnalysis() {
    if (erroAnalise) {
        return `
            <div class="app-container analysis-page">
                <header class="analysis-header">
                    <button class="back-button" id="btnVoltarAnalise" type="button" aria-label="Voltar">←</button>
                    <div><p class="dashboard-eyebrow">Relatórios</p><h1>Análise financeira</h1></div>
                </header>
                <main class="app-content"><div class="card analysis-empty" role="alert">
                    <p>${escaparHtml(erroAnalise)}</p>
                    <button class="secondary-button" id="btnRecarregarAnalise" type="button">Tentar novamente</button>
                </div></main>
            </div>
        `;
    }

    if (!movimentacoesAnalise) {
        return `
            <div class="app-container analysis-page">
                <header class="analysis-header">
                    <button class="back-button" id="btnVoltarAnalise" type="button" aria-label="Voltar">←</button>
                    <div><p class="dashboard-eyebrow">Relatórios</p><h1>Análise financeira</h1></div>
                </header>
                <main class="app-content"><p role="status">Carregando movimentações...</p></main>
            </div>
        `;
    }

    const registros = filtrarMovimentacoesFinanceiras(movimentacoesAnalise, filtrosAnalise);
    const resumo = resumirMovimentacoesFinanceiras(registros);
    return `
        <div class="app-container analysis-page">
            <header class="analysis-header">
                <button class="back-button" id="btnVoltarAnalise" type="button" aria-label="Voltar">←</button>
                <div><p class="dashboard-eyebrow">Relatórios</p><h1>Análise financeira</h1></div>
            </header>
            <main class="app-content analysis-content">
                <details class="card finance-filter-panel">
                    <summary>Filtros do painel</summary>
                    ${renderFiltrosAnalise()}
                    <button class="text-button" id="btnLimparAnalise" type="button">Limpar filtros</button>
                </details>
                <p class="analysis-period-note">${resumo.quantidade} movimentações no período selecionado.</p>
                ${renderIndicadoresAnalise(resumo)}
                ${renderEvolucaoMensal(registros)}
                ${renderGastosPorCategoria(registros)}
                ${renderQuebrasClassificacao(registros, resumo)}
                ${renderCategoriasEmAlta(registros, filtrosAnalise)}
                ${renderNotaAnalise()}
            </main>
        </div>
    `;
}

function renderFiltrosAnalise() {
    const grupos = agruparClassificacoes({ classificacoes: movimentacoesAnalise
        .map((item) => ({
            fluxo: obterFluxoMovimentacao(item),
            natureza: obterNaturezaMovimentacao(item),
            categoria: obterCategoriaMovimentacao(item),
            subcategoria: item.subcategoriaNova || item.subcategoria || ""
        }))
        .filter((item) => item.categoria) });
    const categorias = Array.from(new Set(grupos.map((item) => item.categoria))).sort();
    const subcategorias = Array.from(new Set(grupos.flatMap((item) => item.subcategorias))).sort();
    const inicio = obterIntervaloFinanceiro(filtrosAnalise).inicio;
    const fim = obterIntervaloFinanceiro(filtrosAnalise).fim;

    return `
        <div class="finance-filter-grid">
            ${renderSelectFinanceiro("periodoAnalise", "Período", PERIODOS_FINANCEIROS, filtrosAnalise.periodo, "value", "label")}
            ${renderSelectFinanceiro("fluxoAnalise", "Fluxo", [
                { value: "", label: "Todos os fluxos" },
                { value: "Entrada", label: "Entrada" },
                { value: "Saída", label: "Saída" }
            ], filtrosAnalise.fluxo)}
            ${renderSelectFinanceiro("naturezaAnalise", "Tipo", [
                { value: "", label: "Todos os tipos" },
                { value: "Receita", label: "Receita" },
                { value: "Despesa", label: "Despesa de consumo" },
                { value: "Investimento", label: "Investimento" },
                { value: "Aporte para sonho", label: "Aporte para sonho" }
            ], filtrosAnalise.natureza)}
            ${renderSelectFinanceiro("categoriaAnalise", "Categoria", [
                { value: "", label: "Todas as categorias" },
                ...categorias.map((nome) => ({ value: nome, label: nome }))
            ], filtrosAnalise.categoria)}
            ${renderSelectFinanceiro("subcategoriaAnalise", "Subcategoria", [
                { value: "", label: "Todas as subcategorias" },
                ...subcategorias.map((nome) => ({ value: nome, label: nome }))
            ], filtrosAnalise.subcategoria)}
            ${renderSelectFinanceiro("essencialidadeAnalise", "Essencialidade", [
                { value: "", label: "Todas" },
                { value: "Essencial", label: "Essencial" },
                { value: "Não essencial", label: "Não essencial" },
                { value: "__nao_informado__", label: "Não informado" }
            ], filtrosAnalise.essencialidade)}
            ${renderSelectFinanceiro("comportamentoAnalise", "Comportamento", [
                { value: "", label: "Todos" },
                { value: "Fixo", label: "Fixo" },
                { value: "Variável", label: "Variável" },
                { value: "Periódico", label: "Periódico" },
                { value: "__nao_informado__", label: "Não informado" }
            ], filtrosAnalise.comportamento)}
        </div>
        ${filtrosAnalise.periodo === "custom" ? `
            <div class="finance-filter-grid finance-filter-grid--dates">
                <label>De <input id="inicioAnalise" type="date" value="${formatarDataInputFinanceira(inicio)}"></label>
                <label>Até <input id="fimAnalise" type="date" value="${formatarDataInputFinanceira(fim)}"></label>
            </div>
        ` : ""}
    `;
}

function renderIndicadoresAnalise(resumo) {
    const renda = resumo.entradas;
    const percentual = (valor) => renda > 0
        ? `${((valor / renda) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
        : "—";
    const itens = [
        ["Entradas", resumo.entradas, "income"],
        ["Saídas de caixa", resumo.saidas, "expense"],
        ["Saldo de caixa", resumo.saldo, resumo.saldo < 0 ? "negative" : "positive"],
        ["Despesas de consumo", resumo.consumo, "neutral"],
        ["Investimentos", resumo.investimentos, "investment"],
        ["Aportes para sonhos", resumo.sonhos, "dream"],
        ["Despesas essenciais", resumo.despesasEssenciais, "neutral", percentual(resumo.despesasEssenciais)],
        ["Despesas não essenciais", resumo.despesasNaoEssenciais, "neutral", percentual(resumo.despesasNaoEssenciais)],
        ["Despesas fixas", resumo.despesasFixas, "neutral", percentual(resumo.despesasFixas)],
        ["Despesas variáveis", resumo.despesasVariaveis, "neutral"],
        ["Despesas periódicas", resumo.despesasPeriodicas, "neutral"]
    ];
    return `
        <section class="analysis-metrics" aria-label="Indicadores financeiros">
            ${itens.map(([titulo, valor, classe, proporcao]) => `
                <article class="card analysis-metric analysis-metric--${classe}">
                    <p>${titulo}</p>
                    <strong>${formatarMoeda(valor)}</strong>
                    ${proporcao ? `<small>${proporcao} das entradas</small>` : ""}
                </article>
            `).join("")}
        </section>
    `;
}

function renderEvolucaoMensal(registros) {
    const intervalo = obterIntervaloFinanceiro(filtrosAnalise);
    const hoje = new Date();
    const fim = intervalo.fim && intervalo.fim < hoje ? intervalo.fim : hoje;
    const inicio = intervalo.inicio || (registros.length
        ? interpretarDataFinanceira(registros[registros.length - 1].data)
        : null);
    if (!inicio || inicio > fim) {
        return `<section class="card analysis-panel"><h2>Evolução mensal</h2><p>Não há dados suficientes para este período.</p></section>`;
    }

    const meses = [];
    const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
    while (cursor <= fim && meses.length < 36) {
        const ym = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        const grupo = registros.filter((item) => {
            const data = interpretarDataFinanceira(item.data);
            return data && data.getFullYear() === cursor.getFullYear() && data.getMonth() === cursor.getMonth();
        });
        const soma = resumirMovimentacoesFinanceiras(grupo);
        meses.push({
            label: cursor.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
            id: ym,
            entradas: soma.entradas,
            saidas: soma.saidas,
            consumo: soma.consumo
        });
        cursor.setMonth(cursor.getMonth() + 1);
    }
    if (!meses.length) return "";
    const maximo = Math.max(1, ...meses.flatMap((item) => [item.entradas, item.saidas, item.consumo]));
    return `
        <section class="card analysis-panel">
            <div class="analysis-panel__header"><div><p class="dashboard-eyebrow">Fluxo de caixa</p><h2>Evolução mensal</h2></div></div>
            <div class="analysis-chart-legend">
                <span><i class="legend-income"></i>Entradas</span>
                <span><i class="legend-expense"></i>Saídas de caixa</span>
                <span><i class="legend-consumption"></i>Consumo</span>
            </div>
            <div class="monthly-chart" role="img" aria-label="Entradas, saídas de caixa e despesas de consumo por mês">
                ${meses.map((item) => `
                    <div class="monthly-chart__month" aria-label="${escaparHtml(item.label)}">
                        <div class="monthly-chart__bars">
                            ${renderBarraMensal(item.entradas, maximo, "income", "Entradas")}
                            ${renderBarraMensal(item.saidas, maximo, "expense", "Saídas de caixa")}
                            ${renderBarraMensal(item.consumo, maximo, "consumption", "Consumo")}
                        </div>
                        <span>${escaparHtml(item.label)}</span>
                    </div>
                `).join("")}
            </div>
            <div class="analysis-chart-table">
                ${meses.map((item) => `
                    <div><strong>${escaparHtml(item.label)}</strong><span>Entradas ${formatarMoeda(item.entradas)}</span><span>Saídas ${formatarMoeda(item.saidas)}</span><span>Consumo ${formatarMoeda(item.consumo)}</span></div>
                `).join("")}
            </div>
        </section>
    `;
}

function renderBarraMensal(valor, maximo, tipo, label) {
    const altura = valor > 0 ? Math.max(3, (valor / maximo) * 100) : 0;
    return `<span class="monthly-chart__bar monthly-chart__bar--${tipo}"
        style="height:${altura}%" title="${label}: ${formatarMoeda(valor)}"
        aria-label="${label}: ${formatarMoeda(valor)}"></span>`;
}

function renderGastosPorCategoria(registros) {
    const despesas = registros.filter((item) =>
        normalizarPesquisaFinanceira(obterNaturezaMovimentacao(item)) === "despesa"
    );
    const totalDespesas = despesas.reduce(
        (total, item) => total + converterValorFinanceiro(item.valor),
        0
    );
    const mesesNoPeriodo = obterMesesNoPeriodo(filtrosAnalise, despesas);
    const categorias = agregarMovimentacoes(despesas, "categoria").slice(0, 10)
        .map((item) => ({
            ...item,
            participacao: totalDespesas > 0 ? (item.valor / totalDespesas) * 100 : null,
            mediaMensal: mesesNoPeriodo ? item.valor / mesesNoPeriodo : null
        }));
    const maior = Math.max(1, ...categorias.map((item) => item.valor));
    if (!categorias.length) {
        return `<section class="card analysis-panel"><h2>Despesas por categoria</h2><p>Não há despesas de consumo classificadas no período.</p></section>`;
    }
    const subcategorias = agregarSubcategoriasAnalise(despesas).slice(0, 8);
    const maiorSub = Math.max(1, ...subcategorias.map((item) => item.valor));
    return `
        <section class="card analysis-panel">
            <p class="dashboard-eyebrow">Despesas de consumo</p><h2>Gastos por categoria</h2>
            <div class="analysis-bars">
                ${categorias.map((item) => `
                    <button class="analysis-bar-row" type="button"
                        data-analysis-category="${escaparAtributoFinanceiro(item.nome)}"
                        data-analysis-nature="Despesa" aria-label="Ver histórico de ${escaparAtributoFinanceiro(item.nome)}">
                        <span>${escaparHtml(item.nome)}<small>${item.participacao == null ? "" : `${item.participacao.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do consumo · média ${formatarMoeda(item.mediaMensal)}/mês`}</small></span>
                        <span class="analysis-bar-track"><i style="width:${(item.valor / maior) * 100}%"></i></span>
                        <strong>${formatarMoeda(item.valor)}</strong>
                    </button>
                `).join("")}
            </div>
            <h3>Subcategorias mais representativas</h3>
            <div class="analysis-bars">
                ${subcategorias.map((item) => `
                    <button class="analysis-bar-row" type="button"
                        data-analysis-category="${escaparAtributoFinanceiro(item.categoria)}"
                        data-analysis-subcategory="${escaparAtributoFinanceiro(item.subcategoria)}"
                        data-analysis-nature="Despesa">
                        <span>${escaparHtml(item.nome)}</span>
                        <span class="analysis-bar-track"><i style="width:${(item.valor / maiorSub) * 100}%"></i></span>
                        <strong>${formatarMoeda(item.valor)}</strong>
                    </button>
                `).join("")}
            </div>
        </section>
    `;
}

function agregarSubcategoriasAnalise(registros) {
    const mapa = new Map();
    registros.forEach((item) => {
        const categoria = obterCategoriaMovimentacao(item) || "Não informado";
        const subcategoria = item.subcategoriaNova || item.subcategoria || "Não informada";
        const chave = `${categoria}\u0000${subcategoria}`;
        mapa.set(chave, (mapa.get(chave) || 0) + converterValorFinanceiro(item.valor));
    });
    return Array.from(mapa.entries())
        .map(([chave, valor]) => {
            const [categoria, subcategoria] = chave.split("\u0000");
            return { categoria, subcategoria, nome: `${categoria} · ${subcategoria}`, valor };
        })
        .sort((a, b) => b.valor - a.valor);
}

function obterMesesNoPeriodo(filtros, registros) {
    const intervalo = obterIntervaloFinanceiro(filtros);
    let inicio = intervalo.inicio;
    let fim = intervalo.fim;
    if (!inicio && registros.length) {
        const datas = registros.map((item) => interpretarDataFinanceira(item.data)).filter(Boolean);
        if (!datas.length) return 0;
        inicio = new Date(Math.min(...datas.map((data) => data.getTime())));
        fim = new Date(Math.max(...datas.map((data) => data.getTime())));
    }
    if (!inicio || !fim || inicio > fim) return 0;
    return Math.max(
        1,
        (fim.getFullYear() - inicio.getFullYear()) * 12 +
            fim.getMonth() - inicio.getMonth() + 1
    );
}

function renderQuebrasClassificacao(registros, resumo) {
    const totalClassificadoEssencialidade =
        resumo.despesasEssenciais + resumo.despesasNaoEssenciais;
    const gruposComportamento = [
        { nome: "Fixo", valor: resumo.despesasFixas },
        { nome: "Variável", valor: resumo.despesasVariaveis },
        { nome: "Periódico", valor: resumo.despesasPeriodicas },
        { nome: "Não informado", valor: Math.max(0, resumo.consumo - resumo.despesasFixas - resumo.despesasVariaveis - resumo.despesasPeriodicas) }
    ];
    const maximo = Math.max(1, ...gruposComportamento.map((item) => item.valor));

    return `
        <div class="analysis-split-grid">
            <section class="card analysis-panel">
                <p class="dashboard-eyebrow">Despesas de consumo</p><h2>Essencialidade</h2>
                ${totalClassificadoEssencialidade
                    ? `
                        <div class="analysis-essentiality">
                            <span class="analysis-essentiality__essential"
                                style="width:${(resumo.despesasEssenciais / totalClassificadoEssencialidade) * 100}%"></span>
                            <span class="analysis-essentiality__nonessential"
                                style="width:${(resumo.despesasNaoEssenciais / totalClassificadoEssencialidade) * 100}%"></span>
                        </div>
                        <p>Essenciais: <strong>${formatarMoeda(resumo.despesasEssenciais)}</strong></p>
                        <p>Não essenciais: <strong>${formatarMoeda(resumo.despesasNaoEssenciais)}</strong></p>
                        <small>Despesas sem essencialidade ficam fora desses percentuais.</small>
                    `
                    : `<p>Sem despesas com essencialidade informada neste período.</p>`
                }
            </section>
            <section class="card analysis-panel">
                <p class="dashboard-eyebrow">Comportamento das despesas</p><h2>Fixo, variável e periódico</h2>
                <div class="analysis-bars">
                    ${gruposComportamento.map((item) => `
                        <div class="analysis-bar-row">
                            <span>${item.nome}</span>
                            <span class="analysis-bar-track"><i style="width:${(item.valor / maximo) * 100}%"></i></span>
                            <strong>${formatarMoeda(item.valor)}</strong>
                        </div>
                    `).join("")}
                </div>
            </section>
        </div>
    `;
}

function renderCategoriasEmAlta(registros, filtros) {
    const intervalo = obterIntervaloFinanceiro(filtros);
    if (!intervalo.inicio || !intervalo.fim || filtros.periodo === "all") return "";
    const duracao = Math.max(1, intervalo.fim.getTime() - intervalo.inicio.getTime() + 86400000);
    const anteriorInicio = new Date(intervalo.inicio.getTime() - duracao);
    const anteriorFim = new Date(intervalo.inicio.getTime() - 86400000);
    const filtrosAnteriores = {
        ...filtros,
        periodo: "custom",
        dataInicio: formatarDataInputFinanceira(anteriorInicio),
        dataFim: formatarDataInputFinanceira(anteriorFim)
    };
    const registrosAnteriores = filtrarMovimentacoesFinanceiras(
        movimentacoesAnalise,
        filtrosAnteriores
    );
    const atuaisPorCategoria = agregarMovimentacoes(
        registros.filter((item) => normalizarPesquisaFinanceira(obterNaturezaMovimentacao(item)) === "despesa"),
        "categoria"
    );
    const anterioresPorCategoria = new Map(agregarMovimentacoes(
        registrosAnteriores.filter((item) => normalizarPesquisaFinanceira(obterNaturezaMovimentacao(item)) === "despesa"),
        "categoria"
    ).map((item) => [item.nome, item.valor]));
    const mudancas = atuaisPorCategoria.map((item) => ({
        ...item,
        anterior: anterioresPorCategoria.get(item.nome) || 0,
        variacao: anterioresPorCategoria.get(item.nome)
            ? ((item.valor - anterioresPorCategoria.get(item.nome)) / anterioresPorCategoria.get(item.nome)) * 100
            : null
    })).filter((item) => item.variacao !== null)
        .sort((a, b) => b.variacao - a.variacao)
        .slice(0, 5);

    return `
        <section class="card analysis-panel">
            <p class="dashboard-eyebrow">Comparação de períodos iguais</p><h2>Variação por categoria</h2>
            ${mudancas.length
                ? `<div class="analysis-change-list">${mudancas.map((item) => `
                    <div><span>${escaparHtml(item.nome)}</span>
                        <strong class="${item.variacao >= 0 ? "analysis-change--up" : "analysis-change--down"}">
                            ${item.variacao >= 0 ? "+" : ""}${item.variacao.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                        </strong>
                        <small>${formatarMoeda(item.anterior)} → ${formatarMoeda(item.valor)}</small>
                    </div>
                `).join("")}</div>`
                : `<p>Sem dados do período anterior para uma comparação confiável.</p>`
            }
        </section>
    `;
}

function renderNotaAnalise() {
    return `
        <p class="analysis-method-note">
            Saldo = entradas − todas as saídas de caixa. Despesas de consumo, investimentos e aportes para sonhos são separados por natureza. Percentuais sobre renda usam as entradas filtradas; sem entradas, são exibidos como indisponíveis. Itens antigos sem classificação de essencialidade ou comportamento aparecem como não informados, não como zero.
        </p>
    `;
}

async function inicializarAnalysis() {
    document.getElementById("btnVoltarAnalise")
        ?.addEventListener("click", () => navegar("settings"));
    document.getElementById("btnRecarregarAnalise")
        ?.addEventListener("click", () => {
            movimentacoesAnalise = null;
            erroAnalise = "";
            app.innerHTML = renderAnalysis();
            inicializarAnalysis();
        });

    if (erroAnalise) return;

    if (!movimentacoesAnalise) {
        try {
            movimentacoesAnalise = await obterHistorico();
            erroAnalise = "";
            app.innerHTML = renderAnalysis();
            inicializarAnalysis();
        } catch (erro) {
            console.error("Erro ao carregar dados da análise:", erro);
            erroAnalise = "Não foi possível carregar as movimentações para a análise.";
            app.innerHTML = renderAnalysis();
            inicializarAnalysis();
        }
        return;
    }

    ligarFiltrosAnalise();
    document.querySelectorAll("[data-analysis-category]").forEach((botao) =>
        botao.addEventListener("click", () => abrirHistoricoFiltrado({
            natureza: botao.dataset.analysisNature,
            categoria: botao.dataset.analysisCategory,
            periodo: filtrosAnalise.periodo,
            dataInicio: filtrosAnalise.dataInicio,
            dataFim: filtrosAnalise.dataFim
        }))
    );
    document.querySelectorAll("[data-analysis-subcategory]").forEach((botao) =>
        botao.addEventListener("click", () => abrirHistoricoFiltrado({
            natureza: botao.dataset.analysisNature,
            categoria: botao.dataset.analysisCategory,
            subcategoria: botao.dataset.analysisSubcategory,
            periodo: filtrosAnalise.periodo,
            dataInicio: filtrosAnalise.dataInicio,
            dataFim: filtrosAnalise.dataFim
        }))
    );
}

function ligarFiltrosAnalise() {
    const mapa = {
        periodoAnalise: "periodo",
        fluxoAnalise: "fluxo",
        naturezaAnalise: "natureza",
        categoriaAnalise: "categoria",
        subcategoriaAnalise: "subcategoria",
        essencialidadeAnalise: "essencialidade",
        comportamentoAnalise: "comportamento"
    };
    Object.keys(mapa).forEach((id) => {
        document.getElementById(id)?.addEventListener("change", (event) => {
            filtrosAnalise[mapa[id]] = event.target.value;
            if (id === "periodoAnalise" && filtrosAnalise.periodo === "custom") {
                filtrosAnalise.dataInicio = formatarDataInputFinanceira(
                    obterIntervaloFinanceiro({ periodo: "this-month" }).inicio
                );
                filtrosAnalise.dataFim = formatarDataInputFinanceira(new Date());
            }
            renderizarAnaliseNovamente();
        });
    });
    document.getElementById("inicioAnalise")?.addEventListener("change", (event) => {
        filtrosAnalise.dataInicio = event.target.value;
        renderizarAnaliseNovamente();
    });
    document.getElementById("fimAnalise")?.addEventListener("change", (event) => {
        filtrosAnalise.dataFim = event.target.value;
        renderizarAnaliseNovamente();
    });
    document.getElementById("btnLimparAnalise")?.addEventListener("click", () => {
        filtrosAnalise = criarFiltrosFinanceiros("current-year");
        renderizarAnaliseNovamente();
    });
}

function renderizarAnaliseNovamente() {
    app.innerHTML = renderAnalysis();
    inicializarAnalysis();
}
