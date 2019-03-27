
/**
 * @param {Boolean} recurso 
 * @@param {Number} idCiudad 
 * @returns {void}
 */
function peticionXHR(recurso = 1, idCiudad) {
    let sFichero = 'json/areas.json';
    
    let appId = '123bd783ca7ed95d18f949ea84051a1c';
    let sPrediccion = 'http://api.openweathermap.org/data/2.5/forecast';
    sPrediccion += `?id=${idCiudad}&appid=${appId}&cnt=24&units=metric&lang=es`;
    
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
        area.addEventListener('click', e => peticionXHR(0, e.target.dataset.cityId));
        mapa.appendChild(area);
    }
    document.querySelector('.mapa').appendChild(mapa);
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
    let final = tratarGrupos(grupos);
    // TO DO
}

/**
 * 
 * @param {Object} objeto
 * @returns {Object}
 */
function destructurar(objeto) {
    let {
        clouds: {all: nubes},
        dt_txt: fecha,
        main: {temp_max: maxima, temp_min: minima, grnd_level: presion},
        sys: {pod: luz},
        weather: [{description: leyenda, id: codigo, main: grupo}],
        wind: {speed: viento}
    } = objeto;
    
    return {fecha: fecha, maxima: maxima, minima: minima, leyenda: leyenda, viento: viento, 
        nubes: nubes, presion: presion, grupo: grupo, codigo: codigo, luz: luz};
}

const getDia = a => new Date(a).getDate();

/**
 * 
 * @param {Object} objeto
 * @returns {Boolean}
 */
function enFecha(objeto) {
    let hoy = getDia(Date.now());
    let fechaObjeto = getDia(objeto.fecha);
    if (fechaObjeto <= hoy + 2) {
        return true;
    }
    return false;
}

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


function tratarGrupos(array) {
    let final = [];
    let hoy = array[0][0], pasado;
    hoy.icono = getIcono(hoy.grupo, hoy.codigo, hoy.luz);
    final.push(hoy);
    array.shift();
    for (let i = 0; i < array.length; i++) {
        pasado = promedioPrediccion(array[i]);
        pasado.luz = hoy.luz;
        pasado.icono = getIcono(pasado.grupo, pasado.codigo, pasado.luz);
        final.push(pasado);
    }
    console.log(final);
    return final;
}

function promedioPrediccion(array) {
    let fecha = array[0].fecha;
    let maxima = 0, minima = 0, viento = 0, nubes = 0, presion = 0, n = array.length;
    let leyenda = [], grupo = [], codigo = [];
    for (let i = 0; i < array.length; i++) {
        maxima += array[i].maxima;
        minima += array[i].minima;
        viento += array[i].viento;
        nubes += array[i].nubes;
        presion += array[i].presion;
        leyenda.push(array[i].leyenda);
        grupo.push(array[i].grupo);
        codigo.push(array[i].codigo);
    }
    return {fecha: fecha, 
        maxima: (maxima / n).toFixed(2), 
        minima: (minima / n).toFixed(2), 
        viento: (viento / n).toFixed(2), 
        nubes: parseInt(nubes / n), 
        presion: (presion / n).toFixed(2), 
        leyenda: masRepetido(leyenda), 
        grupo: masRepetido(grupo), 
        codigo: masRepetido(codigo)};
}


function masRepetido(array) {
    let valor = [], cantidad = [];
    for (let i = 0; i < array.length; i++) {
        if (valor.includes(array[i])) {
            cantidad[valor.indexOf(array[i])]++;
        } else {
            valor.push(array[i]);
            cantidad.push(1);
        }
    }
    let mayor = 0;
    for (let i = 0; i < cantidad.length; i++) {
        if (cantidad[i] > mayor) {
            mayor = cantidad[i];
        }
    }
    return valor[cantidad.indexOf(mayor)];
}

/**
 * 
 * @param {type} texto
 * @returns {String}
 */
function montarFecha(texto) {
    let meses = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    let dias = ['SUN', 'MON', 'TUE', 'THU', 'FRI', 'SAT'];
    let fecha = new Date(texto);
    let diaNum = fecha.getDate();
    let diaTxt = dias[fecha.getDay()];
    let mes = meses[fecha.getMonth()];
    return `${diaTxt} ${diaNum} ${mes}`;    
}


/**
 * 
 * @param {String} grupo
 * @param {Number} codigo
 * @param {String} luz
 * @returns {String}
 */
function getIcono(grupo, codigo, luz) {
    let sIcono = '';
    switch (grupo) {
        case 'Thunderstorm':
            sIcono = '11d';
            break;
        case 'Drizzle':
            sIcono = '09d';
            break;
        case 'Rain':
            if (codigo >= 520) {
                sIcono = '09d';
            } else if (codigo < 510) {
                sIcono = '10d';
            } else {
                sIcono = '13d';
            }
            break;
        case 'Snow':
            sIcono = '13d';
            break;
        case 'Clear':
            sIcono = `01${luz}`;
            break;
        case 'Clouds':
            if (codigo > 802) {
                sIcono = `04${luz}`;
            } else {
                codigo === 801 ? sIcono = `02${luz}` : sIcono = `03${luz}`;
            }
            break;
        default:
            sIcono = '50d';            
    }
    return `${sIcono}.png`;
}

function gestionarError(e) {
    
}

window.addEventListener('load', peticionXHR);


