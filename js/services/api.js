/* ============================================
   CONFIGURAÇÃO DA API
============================================ */

const API_URL = "https://script.google.com/macros/s/AKfycbzqqw5QNFUcbVpz9xW1wKPqfXTHFRrdYIXgR9-UBJofEa1YJXV5sgk5m8qZfvg5ghUU/exec";

/* ============================================
   ENVIAR MOVIMENTAÇÃO
============================================ */

async function salvarNaPlanilha(registro){

    try{

        const formData = new URLSearchParams();

        formData.append(
            "registro",
            JSON.stringify(registro)
        );

        const resposta = await fetch(API_URL,{

            method:"POST",

            body: formData

        });

        const resultado = await resposta.json();

        console.log(resultado);

        return resultado;

    }catch(erro){

        console.error(erro);

        alert("Erro ao conectar com a planilha.");

    }

}

/* ============================================
   OBTER SUBCATEGORIAS
============================================ */

async function obterSubcategorias(){

    try{

        const resposta = await fetch(

            API_URL + "?acao=subcategorias"

        );

        return await resposta.json();

    }catch(erro){

        console.error(erro);

        return [];

    }

}

async function obterDashboard(){

    const resposta = await fetch(

        API_URL + "?acao=dashboard&t=" + Date.now(),

        {

            cache:"no-store"

        }

    );

    return await resposta.json();

}