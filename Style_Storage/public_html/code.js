
function iniciar() {
    localStorage.setItem('seawind',JSON.stringify(seawind));
    localStorage.setItem('sunrise',JSON.stringify(sunrise));
    localStorage.setItem('sunset',JSON.stringify(sunset));
    
    document.querySelector("select#predef").addEventListener('change', applyChange);
    document.querySelector("input[type='button']").addEventListener('click', addTheme);
    document.querySelector('input[type="color"]#back').addEventListener('change', changeBackground);
    document.querySelector('input[type="color"]#back').value = '#ffffff';
    document.querySelector('input[type="color"]#front').addEventListener('change', changeTextColor);
    document.querySelector('input[type="color"]#front').value = '#000000';
    document.querySelector('select#font').selectedIndex = 0;
    document.querySelector('select#font').addEventListener('change', changeFont);
    document.querySelector('select#predef').selectedIndex = -1;
}

function applyChange() {
    let eSelect = document.querySelector("select#predef");
    let eOption = eSelect.options[eSelect.selectedIndex];
    let thName = eOption.value, oTheme;
    if (eOption.dataset.type.includes('local')) {
        oTheme = localStorage.getItem(thName);
    } else {
	oTheme = sessionStorage.getItem(thName);
    }
    setStyles(JSON.parse(oTheme));
}

function addTheme() {
    let eInput = document.querySelector('input[type="text"]');
    let theme = eInput.value;
    if (theme) {
        theme = prepString(theme);
        let control = document.getElementById('predef');
        control.appendChild(getOption(theme));
        let oTheme = getThemeObject();        
        sessionStorage.setItem(theme, JSON.stringify(oTheme));
        document.querySelector('input[type="text"]').value = '';
        control.selectedIndex = control.childElementCount - 1;
    } else {
	alert('You must enter a name');
        eInput.focus();
    }
}

function prepString(string) {
    let newString = string.trim().toLowerCase();
    let aString = newString.split('');
    aString[0] = aString[0].toUpperCase();
    return aString.join('');
}

function setStyles(theme) {
    let bodyStyle = `background-color:${theme.back};font-family:${theme.font}`;
    let txtStyle = `color:${theme.text};border-color:${theme.text}`;
    document.querySelector('body').setAttribute('style',bodyStyle);
    document.querySelector('header > h1').setAttribute('style', `color:${theme.text}`);
    document.querySelector('#txt').setAttribute('style', txtStyle);
}

function getOption(txt) {
    let newOption = document.createElement('OPTION');
    newOption.dataset.type = 'session';
    newOption.value = txt;
    newOption.textContent = txt;
    return newOption;
}

function getThemeObject() {
    let back = document.getElementById('back');
    let front = document.getElementById('front');
    let font = document.getElementById('font');
    return {
        back: back.value,
        text: front.value,
        font: font.value        
    };
}

function changeBackground(e) {
    document.querySelector('body').style.backgroundColor = e.target.value;
}

function changeTextColor(e) {
    let eTxt = document.getElementById('txt');
    eTxt.style.color = e.target.value;
    eTxt.style.borderColor = e.target.value;
    document.getElementsByTagName('H1')[0].style.color = e.target.value;
}

function changeFont() {
    let font = document.getElementById('font').value;
    document.querySelector('body').style.fontFamily = font;
}

window.addEventListener('load', iniciar);