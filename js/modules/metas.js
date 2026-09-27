function renderMetas() {

    return `

        <div class="app-container metas-page">

            <main class="app-content">

                <section class="metas-container">

                    <header class="metas-header">

                        <div>
                            <h1>Metas</h1>
                            <p>Organize seus objetivos financeiros.</p>
                        </div>

                        <button
                            type="button"
                            class="btn-nova-meta"
                            id="btnNovaMeta"
                        >
                            + Nova Meta
                        </button>

                    </header>


                    <section class="metas-section">

                        <div class="metas-section-header">
                            <h2>Metas Ativas</h2>
                        </div>

                        <div
                            id="metasAtivas"
                            class="metas-grid"
                        >
                            <p class="metas-vazio">
                                Nenhuma meta ativa.
                            </p>
                        </div>

                    </section>


                    <section class="metas-section">

                        <div class="metas-section-header">
                            <h2>Lista de Desejos</h2>
                        </div>

                        <div
                            id="listaDesejos"
                            class="metas-grid"
                        >
                            <p class="metas-vazio">
                                Nenhum desejo cadastrado.
                            </p>
                        </div>

                    </section>


                    <div class="metas-finalizadas-trigger">

                        <button
                            type="button"
                            id="btnVerMetasFinalizadas"
                            class="btn-ver-metas-finalizadas"
                        >
                            Ver metas concluídas e encerradas
                        </button>

                    </div>


                    <!-- MODAL METAS FINALIZADAS -->

                    <div
                        id="modalMetasFinalizadas"
                        class="modal-meta"
                        hidden
                    >

                        <div class="modal-meta__content modal-metas-finalizadas">

                            <div class="modal-meta__header">

                                <div>
                                    <p class="modal-meta__eyebrow">
                                        Histórico
                                    </p>

                                    <h2>Metas concluídas e encerradas</h2>
                                </div>

                                <button
                                    type="button"
                                    id="btnFecharMetasFinalizadas"
                                    class="modal-meta__close"
                                    aria-label="Fechar"
                                >
                                    ×
                                </button>

                            </div>


                            <div
                                id="listaMetasFinalizadas"
                                class="metas-finalizadas-lista"
                            >
                                <p class="metas-vazio">
                                    Nenhuma meta concluída ou encerrada.
                                </p>
                            </div>

                        </div>

                    </div>


                    <!-- MODAL NOVA META -->

                    <div
                        id="modalNovaMeta"
                        class="modal-meta"
                        hidden
                    >

                        <div class="modal-meta__content">

                            <div class="modal-meta__header">

                                <div>
                                    <p class="modal-meta__eyebrow">
                                        Novo objetivo
                                    </p>

                                    <h2>Nova Meta</h2>
                                </div>

                                <button
                                    type="button"
                                    id="btnFecharNovaMeta"
                                    class="modal-meta__close"
                                    aria-label="Fechar"
                                >
                                    ×
                                </button>

                            </div>


                            <form id="formNovaMeta">

                                <div class="form-group">

                                    <label for="nomeMeta">
                                        Nome da meta
                                    </label>

                                    <input
                                        type="text"
                                        id="nomeMeta"
                                        name="nomeMeta"
                                        placeholder="Ex.: Carro"
                                        required
                                    >

                                </div>


                                <div class="form-group">

                                    <label for="valorMeta">
                                        Valor da meta
                                    </label>

                                    <input
                                        type="text"
                                        id="valorMeta"
                                        name="valorMeta"
                                        placeholder="R$ 0,00"
                                        inputmode="decimal"
                                        required
                                    >

                                </div>


                                <div class="form-group">

                                    <label for="tipoMeta">
                                        Tipo
                                    </label>

                                    <select
                                        id="tipoMeta"
                                        name="tipoMeta"
                                        required
                                    >

                                        <option value="DESEJO">
                                            Lista de desejos
                                        </option>

                                        <option value="ATIVA">
                                            Meta ativa
                                        </option>

                                    </select>

                                </div>


                                <div class="form-group">

                                    <label for="prioridadeMeta">
                                        Prioridade
                                    </label>

                                    <select
                                        id="prioridadeMeta"
                                        name="prioridadeMeta"
                                        required
                                    >

                                        <option value="ALTA">
                                            Alta
                                        </option>

                                        <option value="MÉDIA" selected>
                                            Média
                                        </option>

                                        <option value="BAIXA">
                                            Baixa
                                        </option>

                                    </select>

                                </div>


                                <div class="modal-meta__actions">

                                    <button
                                        type="button"
                                        id="btnCancelarNovaMeta"
                                        class="btn-secundario"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        class="btn-nova-meta"
                                    >
                                        Criar Meta
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </section>

            </main>


            <!-- RODAPÉ DE NAVEGAÇÃO -->

            <nav class="bottom-nav" aria-label="Navegação principal">

                <button
                    class="bottom-nav__item"
                    type="button"
                    id="btnDashboard"
                >
                    <span class="bottom-nav__icon">⌂</span>
                    <span class="bottom-nav__label">Dashboard</span>
                </button>


                <button
                    class="bottom-nav__item"
                    type="button"
                    id="btnHistorico"
                >
                    <span class="bottom-nav__icon">☰</span>
                    <span class="bottom-nav__label">Histórico</span>
                </button>


                <button
                    class="bottom-nav__item bottom-nav__item--center"
                    type="button"
                    id="btnNovaMovimentacao"
                >
                    <span class="bottom-nav__icon bottom-nav__icon--center">+</span>
                </button>


                <button
                    class="bottom-nav__item bottom-nav__item--active"
                    type="button"
                    id="btnMetas"
                >
                    <span class="bottom-nav__icon">◎</span>
                    <span class="bottom-nav__label">Metas</span>
                </button>


                <button
                    class="bottom-nav__item"
                    type="button"
                >
                    <span class="bottom-nav__icon">⋯</span>
                    <span class="bottom-nav__label">Mais</span>
                </button>

            </nav>

        </div>

    `;

}