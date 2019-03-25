
function iniciar() {
    let eForm = document.login;
    eForm.setAttribute('novalidate', true);
    eForm.addEventListener('submit', validateForm);
    document.querySelector('img.passControl').addEventListener('click', passShowHide);
    eForm['mail'].focus();
}

function passShowHide(e) {
    let eImg = e.target;
    if (eImg.src.includes('Invisible')) {
        eImg.setAttribute('src', 'img/Visible_32.png');
        document.querySelector('input#pass').setAttribute('type', 'password');
    } else {
        eImg.setAttribute('src', 'img/Invisible_32.png');
        document.querySelector('input#pass').setAttribute('type', 'text');	
    }
}

function validateForm(e) {
    e.preventDefault();
    validateElement('mail');
    validateElement('pass');
}

function validateElement(elementId) {
    let eElement = document.getElementById(elementId);
    if (eElement.validity.valueMissing) {
        let txt = eElement.parentElement.firstElementChild.textContent;
        showError(eElement, `Enter your ${txt.toLowerCase()}`);
    } else {
	if (eElement.validity.patternMismatch) {
            showError(eElement, eElement.title);
        } else {
            resetErrorMsg(eElement);            
        }
    }
    showTopError();
}

function showError(element, text) {
    resetErrorMsg(element);
    let ePar = getErrorMsgDiv(text);
    element.insertAdjacentElement('beforebegin', ePar);
}

function resetErrorMsg(element) {
    if (element.previousElementSibling.classList.contains('inputError')) {
        element.parentElement.removeChild(element.previousElementSibling);
    }    
}

function getErrorMsgDiv(text) {
    let eDiv = document.createElement('DIV');
    eDiv.classList.add('inputError');
    eDiv.textContent = text;
    return eDiv;
}

function showTopError() {
    let eDiv = document.getElementById('msgArea');
    eDiv.innerHTML = '';
    
    let cError = document.querySelectorAll('div.inputError');
    if (cError.length) {
        createMessage("Theres's a problem", 1);
        for (let i = 0; i < cError.length; i++) {
            eDiv.appendChild(getPagrphElmnt(cError[i].textContent));
        }
    } else {
	createMessage("Registration successfully completed!");
        setTimeout(clean, 200);
    }
    eDiv.scrollIntoView();
}

function getPagrphElmnt(txt) {
    let eParag = document.createElement('P');
    eParag.classList.add('errorItem');
    eParag.textContent = txt;
    return eParag;
}

function createMessage(text, error = 0) {
    let eDiv = document.getElementById('msgArea'), sClass;
    eDiv.innerHTML = '';
    
    let eHeading = document.createElement('H2');
    eHeading.textContent = text;
    eDiv.appendChild(eHeading);
    
    error ? sClass = 'errorMessage' : sClass = 'validMessage';
    if (eDiv.classList.contains('errorMessage')) {
        eDiv.classList.remove('errorMessage');
    }
    eDiv.classList.add(sClass);
}

function clean() {
    document.querySelectorAll('input[required]').forEach(a => a.value = '');
}

window.addEventListener('load', iniciar);


