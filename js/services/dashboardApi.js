/* ============================================
   BUSCAR DADOS DO DASHBOARD
============================================ */

async function obterDashboard() {

    try {

        const resposta = await fetch(
            API_URL + "?acao=dashboard"
        );

        const dados = await resposta.json();

        return dados;

    } catch (erro) {

        console.error(erro);

        return null;

    }

}