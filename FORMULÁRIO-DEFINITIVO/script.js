document.addEventListener("DOMContentLoaded", () => {
    initInputRestrictions();
    initMasks();
    loadStoredData();

    const formP1 = document.getElementById("form-pagina1");
    const formP2 = document.getElementById("form-pagina2");
    const formP3 = document.getElementById("form-pagina3");

    if (formP1) formP1.addEventListener("submit", processPage1);
    if (formP2) formP2.addEventListener("submit", processPage2);
    if (formP3) formP3.addEventListener("submit", processPage3);

    // Consulta CEP automática na Página 2
    const cepInput = document.getElementById("cep");
    if (cepInput) {
        cepInput.addEventListener("blur", fetchCEP);
    }
});

/* ========================================================
   1. RESTRIÇÕES DE ENTRADA E TECLAS PROIBIDAS (CAPS/SHIFT OK)
   ======================================================== */
function initInputRestrictions() {
    // Bloqueia números e caracteres especiais em campos de texto puro
    const textOnlyInputs = document.querySelectorAll(".only-text");
    textOnlyInputs.forEach(input => {
        input.addEventListener("keydown", (e) => {
            const allowedKeys = ["Backspace", "Tab", "Delete", "ArrowLeft", "ArrowRight", "Shift", "CapsLock", " "];
            if (allowedKeys.includes(e.key)) return;

            // Permite apenas letras (com acentos)
            const regex = /^[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]$/;
            if (!regex.test(e.key)) {
                e.preventDefault();
                showAlert("Ação Bloqueada: Números e caracteres especiais não são permitidos neste campo de texto.");
            }
        });
    });

    // Bloqueia letras em campos estritamente numéricos
    const numberOnlyInputs = document.querySelectorAll(".only-number");
    numberOnlyInputs.forEach(input => {
        input.addEventListener("keydown", (e) => {
            const allowedKeys = ["Backspace", "Tab", "Delete", "ArrowLeft", "ArrowRight", "Shift", "CapsLock"];
            if (allowedKeys.includes(e.key)) return;

            if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
                showAlert("Ação Bloqueada: Apenas números são permitidos neste campo.");
            }
        });
    });
}

/* ========================================================
   2. MÁSCARAS AUTOMÁTICAS (TELEFONE, CPF, CEP)
   ======================================================== */
function initMasks() {
    const phoneInput = document.querySelector(".mask-phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "");
            v = v.substring(0, 11);
            if (v.length > 10) {
                e.target.value = v.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
            } else if (v.length > 6) {
                e.target.value = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
            } else if (v.length > 2) {
                e.target.value = v.replace(/^(\d{2})(\d{0,5})$/, "($1) $2");
            } else {
                e.target.value = v;
            }
        });
    }

    const cpfInput = document.querySelector(".mask-cpf");
    if (cpfInput) {
        cpfInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "").substring(0, 11);
            e.target.value = v
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        });
    }

    const cepInput = document.querySelector(".mask-cep");
    if (cepInput) {
        cepInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "").substring(0, 8);
            e.target.value = v.replace(/^(\d{5})(\d)/, "$1-$2");
        });
    }
}

/* ========================================================
   3. VALIDAÇÕES MATEMÁTICAS E LÓGICAS (CPF, IDADE, EMAIL, CEP)
   ======================================================== */
function validarCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, "");
    if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) return false;

    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCPF.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCPF.substring(10, 11))) return false;

    return true;
}

function validarIdade(dataNascimentoStr) {
    if (!dataNascimentoStr) return false;
    const dataNasc = new Date(dataNascimentoStr);
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNasc.getFullYear();
    const m = hoje.getMonth() - dataNasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) {
        idade--;
    }
    return idade >= 15 && idade <= 75;
}

function validarEmailCompleto(email) {
    // Validação estrita que impede e-mails incompletos como "user@domain." ou apenas "@."
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

async function fetchCEP() {
    const cepVal = document.getElementById("cep").value.replace(/\D/g, "");
    if (cepVal.length !== 8) return;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cepVal}/json/`);
        const data = await response.json();
        if (data.erro) {
            showAlert("CEP não encontrado ou não registrado legalmente nos Correios.");
            return false;
        }
        document.getElementById("logradouro").value = data.logradouro || "";
        document.getElementById("bairro").value = data.bairro || "";
        document.getElementById("cidade").value = data.localidade || "";
        document.getElementById("estado").value = data.uf || "";
        return true;
    } catch (err) {
        showAlert("Erro ao validar o CEP legal. Verifique sua conexão com a internet.");
        return false;
    }
}

/* ========================================================
   4. PROCESSAMENTO DE PÁGINAS E NAVEGAÇÃO
   ======================================================== */
function processPage1(e) {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const dataNascimento = document.getElementById("data_nascimento").value;
    const telefone = document.getElementById("telefone").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const responsavel = document.getElementById("responsavel").value.trim();
    const emailPessoal = document.getElementById("email_pessoal").value.trim();
    const emailInst = document.getElementById("email_institucional").value.trim();

    // Verificação de preenchimento obrigatório
    if (!nome || !dataNascimento || !telefone || !cpf || !responsavel || !emailPessoal || !emailInst) {
        showAlert("Ação Não Permitida: Responda todos os campos obrigatórios para avançar.");
        return;
    }

    // Limites de caracteres
    if (nome.length > 250 || responsavel.length > 250 || emailPessoal.length > 250 || emailInst.length > 250) {
        showAlert("Limite excedido: Os campos de texto devem ter no máximo 250 caracteres.");
        return;
    }

    // Regras específicas
    if (!validarIdade(dataNascimento)) {
        showAlert("Ação Não Permitida: O aluno deve ter idade mínima de 15 anos e máxima de 75 anos.");
        return;
    }

    if (!validarCPF(cpf)) {
        showAlert("Ação Não Permitida: O número de CPF digitado é inválido.");
        return;
    }

    if (!validarEmailCompleto(emailPessoal)) {
        showAlert("Ação Não Permitida: O E-mail Pessoal está incompleto ou em formato inválido.");
        return;
    }

    if (!validarEmailCompleto(emailInst)) {
        showAlert("Ação Não Permitida: O E-mail Institucional está incompleto ou em formato inválido.");
        return;
    }

    // Salva no localStorage e avança
    const dataP1 = { nome, dataNascimento, telefone, cpf, responsavel, emailPessoal, emailInst };
    localStorage.setItem("senai_p1", JSON.stringify(dataP1));
    window.location.href = "endereco.html";
}

async function processPage2(e) {
    e.preventDefault();

    const cep = document.getElementById("cep").value.trim();
    const logradouro = document.getElementById("logradouro").value.trim();
    const numero = document.getElementById("numero").value.trim();
    const bairro = document.getElementById("bairro").value.trim();
    const cidade = document.getElementById("cidade").value.trim();
    const estado = document.getElementById("estado").value.trim();
    const complemento = document.getElementById("complemento").value.trim(); // Opcional

    // Não exige complemento
    if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
        showAlert("Ação Não Permitida: Preencha todos os campos obrigatórios antes de prosseguir.");
        return;
    }

    if (logradouro.length > 250 || bairro.length > 250 || cidade.length > 250 || complemento.length > 250) {
        showAlert("Limite excedido: Os campos de texto devem ter no máximo 250 caracteres.");
        return;
    }

    const cepClean = cep.replace(/\D/g, "");
    if (cepClean.length !== 8) {
        showAlert("Ação Não Permitida: Digite um CEP válido com 8 dígitos.");
        return;
    }

    // Valida no ViaCEP
    try {
        const resp = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
        const data = await resp.json();
        if (data.erro) {
            showAlert("Ação Não Permitida: O CEP informado não está registrado legalmente.");
            return;
        }
    } catch {
        showAlert("Erro de conexão ao verificar registro legal do CEP.");
        return;
    }

    const dataP2 = { cep, logradouro, numero, bairro, cidade, estado, complemento };
    localStorage.setItem("senai_p2", JSON.stringify(dataP2));
    window.location.href = "curso.html";
}

function processPage3(e) {
    e.preventDefault();

    const nomeCurso = document.getElementById("nome_curso").value.trim();
    const turno = document.getElementById("turno").value;
    const modalidade = document.getElementById("modalidade").value;

    if (!nomeCurso || !turno || !modalidade) {
        showAlert("Ação Não Permitida: Responda todos os campos obrigatórios do curso.");
        return;
    }

    if (nomeCurso.length > 250) {
        showAlert("Limite excedido: O nome do curso não pode ultrapassar 250 caracteres.");
        return;
    }

    const dataP3 = { nomeCurso, turno, modalidade };
    localStorage.setItem("senai_p3", JSON.stringify(dataP3));

    gerarPDF();
}

/* ========================================================
   5. GERADOR DE PDF IMPECÁVEL SEM CORTES
   ======================================================== */
function gerarPDF() {
    const p1 = JSON.parse(localStorage.getItem("senai_p1") || "{}");
    const p2 = JSON.parse(localStorage.getItem("senai_p2") || "{}");
    const p3 = JSON.parse(localStorage.getItem("senai_p3") || "{}");

    // Preenche o template oculto do PDF
    document.getElementById("pdf-nome").innerText = p1.nome || "";
    document.getElementById("pdf-data-nascimento").innerText = p1.dataNascimento ? p1.dataNascimento.split("-").reverse().join("/") : "";
    document.getElementById("pdf-telefone").innerText = p1.telefone || "";
    document.getElementById("pdf-cpf").innerText = p1.cpf || "";
    document.getElementById("pdf-responsavel").innerText = p1.responsavel || "";
    document.getElementById("pdf-email-pessoal").innerText = p1.emailPessoal || "";
    document.getElementById("pdf-email-institucional").innerText = p1.emailInst || "";

    document.getElementById("pdf-cep").innerText = p2.cep || "";
    document.getElementById("pdf-logradouro").innerText = p2.logradouro || "";
    document.getElementById("pdf-numero").innerText = p2.numero || "";
    document.getElementById("pdf-bairro").innerText = p2.bairro || "";
    document.getElementById("pdf-cidade-uf").innerText = `${p2.cidade || ""} / ${p2.estado || ""}`;
    document.getElementById("pdf-complemento").innerText = p2.complemento || "N/A";

    document.getElementById("pdf-curso").innerText = p3.nomeCurso || "";
    document.getElementById("pdf-turno").innerText = p3.turno || "";
    document.getElementById("pdf-modalidade").innerText = p3.modalidade || "";

    const element = document.getElementById("pdf-container");
    element.style.display = "block"; // Torna visível para captura do canvas

    const opt = {
        margin:       10,
        filename:     `Ficha_Inscricao_SENAI_${p1.nome ? p1.nome.replace(/\s+/g, "_") : "Aluno"}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = "none"; // Oculta novamente após baixar
    });
}

/* ========================================================
   6. AUXILIARES: RECUPERAÇÃO DE DADOS E ALERTAS
   ======================================================== */
function loadStoredData() {
    const p1 = JSON.parse(localStorage.getItem("senai_p1") || "{}");
    const p2 = JSON.parse(localStorage.getItem("senai_p2") || "{}");
    const p3 = JSON.parse(localStorage.getItem("senai_p3") || "{}");

    // Preenchimento automático ao voltar páginas
    if (document.getElementById("nome") && p1.nome) {
        document.getElementById("nome").value = p1.nome;
        document.getElementById("data_nascimento").value = p1.dataNascimento;
        document.getElementById("telefone").value = p1.telefone;
        document.getElementById("cpf").value = p1.cpf;
        document.getElementById("responsavel").value = p1.responsavel;
        document.getElementById("email_pessoal").value = p1.emailPessoal;
        document.getElementById("email_institucional").value = p1.emailInst;
    }

    if (document.getElementById("cep") && p2.cep) {
        document.getElementById("cep").value = p2.cep;
        document.getElementById("logradouro").value = p2.logradouro;
        document.getElementById("numero").value = p2.numero;
        document.getElementById("bairro").value = p2.bairro;
        document.getElementById("cidade").value = p2.cidade;
        document.getElementById("estado").value = p2.estado;
        document.getElementById("complemento").value = p2.complemento || "";
    }

    if (document.getElementById("nome_curso") && p3.nomeCurso) {
        document.getElementById("nome_curso").value = p3.nomeCurso;
        document.getElementById("turno").value = p3.turno;
        document.getElementById("modalidade").value = p3.modalidade;
    }
}

function showAlert(message) {
    alert(`⚠️ ALERTA SENAI ⚠️\n\n${message}`);
}