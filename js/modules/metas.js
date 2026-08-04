function construirMetas() {
    const dados = dashboard || {};

    const metasBase = [
        {
            nome: "Essencial",
            icone: "🥬",
            valorAtual: Number(dados.essencial || 0),
            valorObjetivo: 18000,
            cor: "var(--color-accent)"
        },
        {
            nome: "Não Essencial",
            icone: "🛍️",
            valorAtual: Number(dados.naoEssencial || 0),
            valorObjetivo: 12000,
            cor: "var(--color-warning)"
        },
        {
            nome: "Investimentos",
            icone: "📈",
            valorAtual: Number(dados.investimentos || 0),
            valorObjetivo: 15000,
            cor: "var(--color-primary)"
        },
        {
            nome: "Sonhos",
            icone: "🎯",
            valorAtual: Number(dados.sonhos || 0),
            valorObjetivo: 20000,
            cor: "var(--color-secondary)"
        }
    ];

    return metasBase.map(meta => {
        const valorAtual = Math.max(0, Number(meta.valorAtual || 0));
        const valorObjetivo = Math.max(1, Number(meta.valorObjetivo || 1));
        const percentual = Math.min(100, Math.max(0, Math.round((valorAtual / valorObjetivo) * 100)));
        const restante = Math.max(0, valorObjetivo - valorAtual);

        return {
            ...meta,
            percentual,
            restante
        };
    });
}

function renderMetas() {
    const metas = construirMetas();

    return `
        <div class="app-container metas-page">
            <header class="app-header metas-header">
                <button class="back-button" type="button" id="btnVoltarDashboard">←</button>
                <div>
                    <p class="dashboard-eyebrow">Minhas metas</p>
                    <h1>Metas</h1>
                </div>
                <button class="metas-header__action" type="button" id="btnNovaMeta">+</button>
            </header>

            <main class="app-content metas-content">
                ${metas.map(meta => `
                    <section class="card metas-card">
                        <div class="metas-card__hero">
                            <div class="metas-card__icon">${meta.icone}</div>
                            <div>
                                <h3>${meta.nome}</h3>
                                <p>${meta.percentual}% concluído</p>
                            </div>
                        </div>

                        <div class="metas-card__values">
                            <div>
                                <span>Valor atual</span>
                                <strong>${formatarMoeda(meta.valorAtual)}</strong>
                            </div>
                            <div>
                                <span>Objetivo</span>
                                <strong>${formatarMoeda(meta.valorObjetivo)}</strong>
                            </div>
                        </div>

                        <div class="metas-card__progress">
                            <div class="metas-card__progress-track">
                                <div class="metas-card__progress-bar" style="width:${meta.percentual}%; background:${meta.cor};"></div>
                            </div>
                            <div class="metas-card__progress-meta">
                                <span>${meta.percentual}%</span>
                                <span>${formatarMoeda(meta.restante)} restantes</span>
                            </div>
                        </div>
                    </section>
                `).join("")}
            </main>
        </div>
    `;
}

function inicializarMetas() {
    const btnVoltar = document.getElementById("btnVoltarDashboard");
    const btnNovaMeta = document.getElementById("btnNovaMeta");

    if (btnVoltar) {
        btnVoltar.addEventListener("click", () => {
            navegar("dashboard");
        });
    }

    if (btnNovaMeta) {
        btnNovaMeta.addEventListener("click", () => {
            alert("Nova meta em breve.");
        });
    }
}
