
/**
 * @param {Boolean} recurso 
 * @@param {Number} idCiudad 
 * @returns {void}
 */
function peticionXHR(recurso = 1, idCiudad) {
    let sFichero = 'json/areas.json';
    
    let appId = '123bd783ca7ed95d18f949ea84051a1c';
    let sPrediccion = 'http://api.openweathermap.org/data/2.5/forecast';
    sPrediccion += `?id=${idCiudad}&appid=${appId}&units=metric&lang=es`;
    
    let eRecurso = recurso ? sFichero : sPrediccion;
    
    let xhr = new XMLHttpRequest();
    xhr.open('GET', eRecurso, true);
    xhr.send(null);
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let aDatos = JSON.parse(xhr.responseText);
            recurso ? crearMapa(aDatos) : cargarDatos(aDatos);
        }
    };
    xhr.addEventListener('error', gestionarError);
}


/**
 * 
 * @param {Array} datos
 * @returns {void}
 */
function crearMapa(...datos) {
    datos = datos.flat();
    document.getElementsByTagName('img')[0].setAttribute('usemap', '#sevilla');
    let mapa = document.createElement('MAP'), area;
    mapa.setAttribute('name', 'sevilla');
    for (let i = 0; i < datos.length; i++) {
        let {nombre, coord, id} = datos[i];
        area = document.createElement('AREA');
        area.setAttribute('shape', 'rect');
        area.setAttribute('alt', nombre);
        area.setAttribute('name', nombre);
        area.setAttribute('coords', coord);
        area.setAttribute('data-city-id', id);
        area.setAttribute('href', '#');
        area.addEventListener('click', restTiempo);
        mapa.appendChild(area);
    }
    document.querySelector('.mapa').appendChild(mapa);
}

/**
 * 
 * @param {Event} e
 * @returns {void}
 */
function restTiempo(e) {
    let idCiudad = e.target.dataset.cityId;
    peticionXHR(0, idCiudad);
}

/**
 * 
 * @param {Object} datos
 * @returns {void}
 */
function cargarDatos(datos) {
    let {list} = datos;
    let aResultado = list.map(destructurar).filter(enFecha);
    let grupos = agruparDatos(aResultado);
    console.log(aResultado);
}

/**
 * 
 * @param {Object} datos
 * @returns {Object}
 */
function destructurar(datos) {
    let {
        clouds: {all: nubes},
        dt_txt: fecha,
        main: {temp_max: maxima, temp_min: minima, grnd_level: presion},
        sys: {pod: luz},
        weather: [{description: leyenda, id: codigo}],
        wind: {speed: viento}
    } = datos;
    
    return {fecha: fecha, maxima: maxima, minima: minima, leyenda: leyenda,
        viento: viento, nubes: nubes, presion: presion, luz: luz, codigo: codigo};
}

/**
 * 
 * @param {Object} objeto
 * @returns {Boolean}
 */
function enFecha(objeto) {
    let hoy = new Date().getDate();
    let fechaObjeto = new Date(objeto.fecha).getDate();
    if (fechaObjeto <= hoy + 2) {
        return true;
    }
    return false;
}

const getDia = a => new Date(a).getDate();

function agruparDatos(datos) {
    let fecha = getDia(datos[0].fecha);
    let dias = [], grupo = [];
    
    for (let i = 0; i < datos.length; i++) {
        if (getDia(datos[i].fecha) === fecha) {
            grupo.push(datos[i]);
            fecha = getDia(datos[i].fecha);
        } else {
            dias.push(grupo);
            grupo = [];
            grupo.push(datos[i]);
            fecha = getDia(datos[i].fecha);
        }
    }
    dias.push(grupo);
    return dias;
}


function montarFecha(texto) {
    let meses = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    let dias = ['SUN', 'MON', 'TUE', 'THU', 'FRI', 'SAT'];
    let fecha = new Date(texto);
    let diaNum = fecha.getDate();
    let diaTxt = dias[fecha.getDay()];
    let mes = meses[fecha.getMonth()];
    return `${diaTxt} ${diaNum} ${mes}`;
    
}

function gestionarError(e) {
    
}

window.addEventListener('load', peticionXHR);


