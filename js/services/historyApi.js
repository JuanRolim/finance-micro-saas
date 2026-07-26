/* ============================================
   BUSCAR HISTÓRICO
============================================ */

async function obterHistorico(){

    try{

        const resposta = await fetch(
            API_URL + "?acao=historico"
        );

        return await resposta.json();

    }catch(erro){

        console.error(erro);

        return [];

    }

}