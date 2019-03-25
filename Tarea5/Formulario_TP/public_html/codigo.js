/**
 * Función que se ejecuta tras la carga de la página disparada por el evento 
 * <code>load</code> del objeto <code>window</code>. Establece sobre el formulario
 * el atributo <code>novalidate</code> para evitar la validación nativa del
 * navegador (se realiza de esta forma para, en caso de fallo en la carga de archivos
 * o desactivación de javascript en el navegador, exista un sistema de validación
 * alternativo). Asigna al evento <code>click</code> del botón <code>submit</code>
 * la función <code>showPasswd()</code>.
 * @returns {void}
 */
function iniciar() {
    let eForm = document.login;
    eForm.setAttribute('novalidate', true);
    eForm.addEventListener('submit', validateForm);
    document.querySelector('img.passControl').addEventListener('click', showPasswd);
    eForm['mail'].focus();
}


/**
 * Cambia el atributo del elemento <code>input</code> de <code>password</code> a
 * <code>text</code> con lo que permite visualizar el texto enmascarado. Cambia
 * el contenido de texto del elemento, elimina el escuchador del evento <code>click</code>
 * a la función <code>showPasswd()</code> y lo asigna nuevamente a la función 
 * <code>hidePasswd()</code>.
 * @param {Event} e el evento disparado en el elemento
 * @returns {void}
 */
function showPasswd(e) {
    let eImg = e.target;
    eImg.setAttribute('src', 'img/Invisible_32.png');
    eImg.removeEventListener('click', showPasswd);
    eImg.addEventListener('click', hidePasswd);
    document.querySelector('input#pass').setAttribute('type', 'text');
}


/**
 * Cambia el atributo del elemento <code>input</code> de <code>text</code> a
 * <code>password</code> con lo que enmascara el texto introducido. Cambia
 * el contenido de texto del elemento, elimina el escuchador del evento <code>click</code>
 * a la función <code>hidePasswd()</code> y lo asigna nuevamente a la función 
 * <code>showPasswd()</code>.
 * @param {Event} e el evento disparado en el elemento
 * @returns {void}
 */
function hidePasswd(e) {
    let eImg = e.target;
    eImg.setAttribute('src', 'img/Visible_32.png');
    eImg.removeEventListener('click', hidePasswd);
    eImg.addEventListener('click', showPasswd);
    document.querySelector('input#pass').setAttribute('type', 'password');
}


/**
 * 
 * @param {Event} e 
 * @returns {void}
 */
function validateForm(e) {
    e.preventDefault();
    validateElement('mail');
    validateElement('pass');
}


/**
 * 
 * @param {String} elementId
 * @returns {void}
 */
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


/**
 * 
 * @param {Element} element
 * @param {String} text
 * @returns {void}
 */
function showError(element, text) {
    resetErrorMsg(element);
    let ePar = getErrorMsgDiv(text);
    element.insertAdjacentElement('beforebegin', ePar);
}


/**
 * 
 * @param {Element} element
 * @returns {void}
 */
function resetErrorMsg(element) {
    if (element.previousElementSibling.classList.contains('inputError')) {
        element.parentElement.removeChild(element.previousElementSibling);
    }    
}


/**
 * 
 * @param {String} text
 * @returns {Element}
 */
function getErrorMsgDiv(text) {
    let eDiv = document.createElement('DIV');
    eDiv.classList.add('inputError');
    eDiv.textContent = text;
    return eDiv;
}


/**
 * 
 * @returns {void}
 */
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


/**
 * 
 * @param {String} txt
 * @returns {void}
 */
function getPagrphElmnt(txt) {
    let eParag = document.createElement('P');
    eParag.classList.add('errorItem');
    eParag.textContent = txt;
    return eParag;
}


 /**
  * 
  * @param {String} text
  * @param {Boolean} error
  * @returns {void}
  */
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


/**
 * 
 * @returns {void}
 */
function clean() {
    document.querySelectorAll('input[required]').forEach(a => a.value = '');
}


/**
 * 
 */
window.addEventListener('load', iniciar);


