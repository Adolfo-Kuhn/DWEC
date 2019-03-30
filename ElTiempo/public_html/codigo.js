
function inicio() {
    let promesa = peticionXHR('json/areas.json');    
    promesa.then(data => crearMapa(data)).catch(e => console.log(e));
}


function peticionXHR(url) {
    return new Promise((resolve, reject) => {
        var aDatos;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.send(null);
        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(xhr.statusText);
            }
        };
        xhr.onerror = () => {
            reject(xhr.statusText);
        };
    });
    
}

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
        area.addEventListener('click', e => pedirCiudad(e));
        mapa.appendChild(area);
    }
    document.querySelector('.mapa').appendChild(mapa);
}


function pedirCiudad(e) {
    let idCiudad = e.target.dataset.cityId;
    let appId = '123bd783ca7ed95d18f949ea84051a1c';
    let sRestURL = 'http://api.openweathermap.org/data/2.5/';
    let sHoy = `weather?id=${idCiudad}&appid=${appId}&units=metric&lang=es`;
    let sOtros = `forecast?id=${idCiudad}&appid=${appId}&cnt=24&units=metric&lang=es`;
    
    let datos = [];
    let promesa1 = peticionXHR(`${sRestURL}${sHoy}`);
    promesa1.then(data => {
        datos.push(data);
        return peticionXHR(`${sRestURL}${sOtros}`);
    })
    .then(data => {
        datos.push(data);
        gestionarDatos(datos);
    })
    .catch(e => console.log(e));    
}

function gestionarDatos(datos) {
    let [oHoy, oOtros] = datos;
    let widgetsInfo = [];
    widgetsInfo.push(destructurarHoy(oHoy));
    let {list} = oOtros;
    let listado = list.map(destructurarOtros).filter(enFecha);
    let aPrediccion = agruparDatos(listado).map(promedioPrediccion);
    aPrediccion.forEach(a => widgetsInfo.push(a));
    insertarDatos(widgetsInfo);
}

function insertarDatos(datos) {
    let eDestino = document.querySelectorAll('div.widget');
    if (eDestino.length) {
        modificarDatos(datos);
    } else {
        let aside = document.querySelector('aside.clima');
	datos.map(crearEstructuraDatos).forEach(a => aside.appendChild(a));
    }
}

function modificarDatos(datos) {
    let eDestino = document.querySelectorAll('div.widget');
    for (let i = 0; i < eDestino.length; i++) {
        let iconoDiv = eDestino[i].querySelector('div.mainIcono');
        iconoDiv.textContent = datos[i].fecha;
        iconoDiv.style.background = `url(http://openweathermap.org/img/w/${datos[i].icono}) no-repeat right`;
        eDestino[i].querySelector('span.tempMax').textContent = datos[i].maxima;
        eDestino[i].querySelector('span.tempMin').textContent = datos[i].minima;
        eDestino[i].querySelector('span.leyenda').textContent = datos[i].leyenda;
        eDestino[i].querySelector('div.viento').textContent = datos[i].viento;
        eDestino[i].querySelector('div.nubes').textContent = `${datos[i].nubes}, ${datos[i].presion}`;
    }
}

function crearEstructuraDatos(objeto) {
    let {fecha, icono, maxima, minima, leyenda, viento, nubes, presion} = objeto;
    let widget = crearElemento('DIV', 'widget');
    
    let eMain = crearElemento('DIV', 'mainIcono', fecha);
    eMain.style.background = `url(http://openweathermap.org/img/w/${icono}) no-repeat right`;
    let eValores = crearElemento('DIV', 'valores');
    
    let eTemps = crearElemento('DIV', 'temperaturas');
    eTemps.appendChild(crearElemento('SPAN', 'tempMax', maxima));
    eTemps.appendChild(crearElemento('SPAN', 'tempMin', minima));
    eTemps.appendChild(crearElemento('SPAN', 'leyenda', leyenda));
    
    let eViento = crearElemento('DIV', 'viento', viento);
    let eNubes = crearElemento('DIV', 'nubes', `${nubes}, ${presion}`);
    
    eValores.appendChild(eTemps);
    eValores.appendChild(eViento);
    eValores.appendChild(eNubes);
    widget.appendChild(eMain);
    widget.appendChild(eValores);
    return widget;
}

function destructurarHoy(objeto) {
    let {
        clouds: {all: nubes},
        main: {temp_max: maxima, temp_min: minima, pressure: presion},
        weather: [{description: leyenda, icon: icono}],
        wind: {speed: viento}
    } = objeto;
    return {fecha: montarFecha(Date.now()), maxima: `${maxima.toFixed(1)} °C`,
        minima: `${minima.toFixed(1)} °C`, leyenda: leyenda, viento: `${viento} m/s`,
        nubes: `${nubes} %`, presion: `${presion} hpa`, icono: `${icono}.png`};
}

function destructurarOtros(objeto) {
    let {
        clouds: {all: nubes},
        dt_txt: fecha,
        main: {temp_max: maxima, temp_min: minima, grnd_level: presion},
        weather: [{description: leyenda, id: codigo, main: grupo}],
        wind: {speed: viento}
    } = objeto;
    
    return {fecha: fecha, maxima: maxima, minima: minima, leyenda: leyenda, viento: viento, 
        nubes: nubes, presion: presion, grupo: grupo, codigo: codigo};
}

function enFecha(objeto) {
    let hoy = new Date(Date.now());
    let maniana = new Date();
    maniana.setDate(hoy.getDate() + 1);
    let pasado = new Date();
    pasado.setDate(hoy.getDate() + 2);
    let fechaObjeto = new Date(objeto.fecha);
    if (fechaObjeto.getDate() === maniana.getDate() || 
        fechaObjeto.getDate() === pasado.getDate()) {
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

function promedioPrediccion(array) {
    let fecha = montarFecha(array[0].fecha);
    let maxima = -100, minima = 100, viento = 0, nubes = 0, presion = 0, n = array.length;
    let leyenda = [], grupo = [], codigo = [];
    for (let i = 0; i < array.length; i++) {
        if (array[i].maxima > maxima) {
            maxima = array[i].maxima;            
        }
        if (array[i].minima < minima) {
            minima = array[i].minima;            
        }
        viento += array[i].viento;            
        nubes += array[i].nubes;            
        presion += array[i].presion;            
        leyenda.push(array[i].leyenda);
        grupo.push(array[i].grupo);
        codigo.push(array[i].codigo);
    }
    grupo = masRepetido(grupo);
    codigo = masRepetido(codigo);
    return {fecha: fecha, maxima: `${maxima.toFixed(1)} °C`, 
        minima: `${minima.toFixed(1)} °C`,
        viento: `${(viento / n).toFixed(2)} m/s`,
        nubes: `${parseInt(nubes / n)} %`, 
        presion: `${(presion / n).toFixed(2)} hpa`,
        leyenda: masRepetido(leyenda),
        icono: getIcono(grupo, codigo, 'd')};
}

function montarFecha(texto) {
    let meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let dias = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let fecha = new Date(texto);
    let diaNum = fecha.getDate();
    let diaTxt = dias[fecha.getDay()];
    let mes = meses[fecha.getMonth()];
    return `${diaTxt} ${diaNum} ${mes}`;    
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

function crearElemento(etiqueta, clase, texto) {
    let elemento = document.createElement(etiqueta);
    elemento.classList.add(clase);
    if (texto) {
        elemento.textContent = texto;
    }
    return elemento;
}

function gestionarError(e) {
    console.log(e);
}

window.addEventListener('load', inicio);