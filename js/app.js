const app = document.getElementById("app");

async function navegar(tela) {

    switch (tela) {

        case "dashboard":

    app.innerHTML = renderDashboard();

    await inicializarDashboard();

    break;

        case "transaction":

            app.innerHTML = renderTransaction();
            inicializarTransaction();
            break;

        case "history":

    await carregarHistorico();

    app.innerHTML = renderHistory();

    inicializarHistory();

    break;

        case "settings":

            app.innerHTML = renderSettings();
            break;

    }

}

document.addEventListener("DOMContentLoaded", () => {
    navegar("dashboard");
});