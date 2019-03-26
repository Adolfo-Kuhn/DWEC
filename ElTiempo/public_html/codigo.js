/**
 * 
 * @returns {void}
 */
function iniciar() {
    cargarZonas();
}

/**
 * 
 * @returns {void}
 */
function cargarZonas() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'areas.json', true);
    xhr.send(null);
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let aDatos = JSON.parse(xhr.responseText);
            crearMapa(aDatos);
        }
    };
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
    cargarPrediccion(idCiudad);
}

/**
 * 
 * @param {Number} idCiudad
 * @returns {void}
 */
function cargarPrediccion(idCiudad) {
    let appId = '123bd783ca7ed95d18f949ea84051a1c';
    let url = 'http://api.openweathermap.org/data/2.5/forecast';
    url += `?id=${idCiudad}&appid=${appId}&cnt=24&units=metric&lang=es`;
    
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send(null);
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let aDatos = JSON.parse(xhr.responseText);
            cargarDatos(aDatos);
        }
    };
}

/**
 * 
 * @param {Object} datos
 * @returns {void}
 */
function cargarDatos(datos) {
    let {list} = datos;
    let aResultado = list.map(destructurar).filter(enFecha);
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
        main: {temp: maxima, temp_min: minima, grnd_level: presion},
        weather: [{description: leyenda}],
        wind: {speed: viento}
    } = datos;
    
    return {fecha: fecha, maxima: maxima, minima: minima, leyenda: leyenda,
        viento: viento, nubes: nubes, presion: presion};
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

window.addEventListener('load', iniciar);


