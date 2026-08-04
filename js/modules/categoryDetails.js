let categoriaDetalhesAtiva = {
    nome: "Essencial",
    mes: new Date().toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
    }),
    valorTotal: 0,
    subcategorias: []
};

function montarCategoriaDetalhes(categoria = "Essencial") {
    const valorTotal = Number(dashboard?.[categoriaToKey(categoria)] || 0);
    const subcategorias = montarSubcategorias(categoria, valorTotal);

    return {
        nome: categoria,
        mes: new Date().toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric"
        }),
        valorTotal,
        subcategorias
    };
}

function categoriaToKey(categoria) {
    switch (categoria) {
        case "Essencial":
            return "essencial";
        case "Não Essencial":
            return "naoEssencial";
        case "Investimentos":
            return "investimentos";
        case "Sonhos":
            return "sonhos";
        default:
            return "essencial";
    }
}

function montarSubcategorias(categoria, valorTotal) {
    const base = [
        { nome: "Moradia", valor: valorTotal * 0.45 },
        { nome: "Alimentação", valor: valorTotal * 0.3 },
        { nome: "Transporte", valor: valorTotal * 0.15 },
        { nome: "Outros", valor: valorTotal * 0.1 }
    ];

    if (categoria === "Não Essencial") {
        return [
            { nome: "Lazer", valor: valorTotal * 0.4 },
            { nome: "Compras", valor: valorTotal * 0.3 },
            { nome: "Delivery", valor: valorTotal * 0.2 },
            { nome: "Outros", valor: valorTotal * 0.1 }
        ];
    }

    if (categoria === "Investimentos") {
        return [
            { nome: "CDB", valor: valorTotal * 0.5 },
            { nome: "Ações", valor: valorTotal * 0.25 },
            { nome: "Poupança", valor: valorTotal * 0.15 },
            { nome: "Outros", valor: valorTotal * 0.1 }
        ];
    }

    if (categoria === "Sonhos") {
        return [
            { nome: "Viagem", valor: valorTotal * 0.45 },
            { nome: "Objetivo", valor: valorTotal * 0.3 },
            { nome: "Reserva", valor: valorTotal * 0.15 },
            { nome: "Outros", valor: valorTotal * 0.1 }
        ];
    }

    return base;
}

function renderCategoryDetails() {
    const categoria = categoriaDetalhesAtiva.nome || "Essencial";
    const total = Number(categoriaDetalhesAtiva.valorTotal || 0);
    const subcategorias = categoriaDetalhesAtiva.subcategorias || [];
    const totalSubcategorias = subcategorias.reduce((acc, item) => acc + Number(item.valor || 0), 0);

    let acumulado = 0;
    const grafo = subcategorias.map(item => {
        const inicio = acumulado;
        const fim = acumulado + (totalSubcategorias > 0 ? Math.round((Number(item.valor || 0) / totalSubcategorias) * 100) : 0);
        acumulado = fim;
        return `${item.cor} ${inicio}% ${fim}%`;
    }).join(", ");

    const gradiente = totalSubcategorias > 0
        ? `conic-gradient(${grafo})`
        : "linear-gradient(135deg, #E5E7EB 0%, #F3F4F6 100%)";

    return `
        <div class="app-container category-detail-page">
            <header class="app-header category-detail-header">
                <button class="back-button" type="button" id="btnVoltarDashboard">←</button>
                <div>
                    <p class="dashboard-eyebrow">Detalhes da categoria</p>
                    <h1>${categoria}</h1>
                </div>
            </header>

            <main class="app-content category-detail-content">
                <section class="card category-detail-summary">
                    <div class="category-detail-summary__intro">
                        <p class="category-detail-summary__label">Mês</p>
                        <h2>${categoriaDetalhesAtiva.mes}</h2>
                    </div>
                    <div class="category-detail-summary__amount">
                        <p class="category-detail-summary__label">Valor total</p>
                        <strong>${formatarMoeda(total)}</strong>
                    </div>
                </section>

                <section class="card category-detail-chart-card">
                    <div class="category-detail-chart" style="background: ${gradiente};">
                        <div class="category-detail-chart__inner"></div>
                    </div>
                    <div class="category-detail-legend">
                        ${subcategorias.map(item => `
                            <div class="category-detail-legend__item">
                                <span class="category-detail-legend__dot" style="background:${item.cor}"></span>
                                <span>${item.nome}</span>
                            </div>
                        `).join("")}
                    </div>
                </section>

                <section class="card category-detail-list-card">
                    <div class="category-detail-list-card__header">
                        <h3>Subcategorias</h3>
                    </div>
                    <div class="category-detail-list">
                        ${subcategorias.map(item => `
                            <div class="category-detail-list__item">
                                <div class="category-detail-list__info">
                                    <span class="category-detail-list__dot" style="background:${item.cor}"></span>
                                    <div>
                                        <strong>${item.nome}</strong>
                                        <p>${item.percentual}% do total</p>
                                    </div>
                                </div>
                                <div class="category-detail-list__values">
                                    <span class="chip chip--active">${item.percentual}%</span>
                                    <strong>${formatarMoeda(item.valor)}</strong>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </section>
            </main>
        </div>
    `;
}

function inicializarCategoryDetails() {
    const btnVoltar = document.getElementById("btnVoltarDashboard");

    if (btnVoltar) {
        btnVoltar.addEventListener("click", () => {
            navegar("dashboard");
        });
    }
}

function abrirCategoriaDetalhes(categoria = "Essencial") {
    categoriaDetalhesAtiva = montarCategoriaDetalhes(categoria);
    categoriaDetalhesAtiva.subcategorias = (categoriaDetalhesAtiva.subcategorias || []).map((item, index) => {
        const colors = ["var(--color-accent)", "var(--color-warning)", "var(--color-primary)", "var(--color-secondary)"];
        const valor = Number(item.valor || 0);
        const percentual = categoriaDetalhesAtiva.valorTotal > 0
            ? Math.round((valor / categoriaDetalhesAtiva.valorTotal) * 100)
            : 0;

        return {
            ...item,
            cor: colors[index % colors.length],
            percentual
        };
    });

    app.innerHTML = renderCategoryDetails();
    inicializarCategoryDetails();
}
