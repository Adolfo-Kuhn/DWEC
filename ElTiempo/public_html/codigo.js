/**
 * Función que se ejecuta tras la carga de la página y hace una petición XHR de
 * un fichero local que contiene el nombre, las coordenadas y el id de cada una
 * de las localidades incluidas en el mapa. Las coordenadas se usan para delimitar
 * las áreas que lanzan los eventos de solicitud de información meteorológica.
 * @returns {void}
 * @see peticionXHR
 */
function inicio() {
    let promesa = peticionXHR('json/areas.json');
    promesa.then(data => crearMapa(data)).catch(gestionarError);
}

/**
 * Realiza una petición XHR mediante una promesa a la URL que recibe por parámetro.
 * @param {String} url cadena de texto con la URL a la que realiza la petición.
 * @returns {Promise} con el resultado de la petición o el error correspondiente.
 */
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

/**
 * Crea el mapa de zonas del gráfico con las áreas definidas por las coordenadas.
 * contenidas en cada uno de los objetos del array que recibe por parámetro. 
 * Dispara el evento <code>click</code> sobre el area que define la localidad de
 * Sevilla para que cargue al inicio.
 * @param {Array} datos array de objetos con la información de cada elemento 
 * <code>area</code>.
 * @returns {void}
 */
function crearMapa(datos) {
    document.getElementsByTagName('img')[0].setAttribute('usemap', '#sevilla');
    let mapa = document.createElement('MAP'), area;
    mapa.setAttribute('name', 'sevilla');
    for (let i = 0; i < datos.length; i++) {
        let {nombre, coord, id} = datos[i];
        area = document.createElement('AREA');
        area.setAttribute('shape', 'rect');
        area.setAttribute('alt', nombre);
        area.setAttribute('coords', coord);
        area.setAttribute('data-city-id', id);
        area.setAttribute('href', '#');
        area.addEventListener('click', e => pedirCiudad(e));
        mapa.appendChild(area);
    }
    document.querySelector('.mapa').appendChild(mapa);

    let pulsar = new MouseEvent('click')
    document.querySelector('area[alt=Sevilla]').dispatchEvent(pulsar);
}

/**
 * Realiza la petición de información para la localidad asociada al elemento 
 * <code>area</code> que dispara el evento. Inserta un elemento <code>H2</code>
 * con el nombre de la localidad en caso de que no existiera, o inserta solo el
 * texto en caso de que existiera. Se realizan peticiones encadenadas para que se
 * muestra toda la información o ninguna.
 * @param {Event} e evento que ha disparado el elemento.
 * @returns {void}
 * @see peticionXHR
 */
function pedirCiudad(e) {
    let idCiudad = e.target.dataset.cityId;
    let appId = '123bd783ca7ed95d18f949ea84051a1c';
    let sRestURL = 'http://api.openweathermap.org/data/2.5/';
    let sHoy = `weather?id=${idCiudad}&appid=${appId}&units=metric&lang=es`;
    let sOtros = `forecast?id=${idCiudad}&appid=${appId}&cnt=24&units=metric&lang=es`;

    let eHeader = document.querySelectorAll('h2');
    if (eHeader.length) {
        eHeader[0].textContent = e.target.alt;
    } else {
        eHeader = document.createElement('H2');
        eHeader.textContent = e.target.alt;
        document.querySelector('aside.clima').appendChild(eHeader);
    }
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
    .catch(gestionarError);
}

/**
 * Prepara los datos recibidos desde la Weather API y los agrupa en un array de
 * tres objetos conteniendo la información
 * @param {Array} datos con la información recibida desde la API
 * @returns {void}
 * @see destructurarHoy
 * @see destructurarOtros
 * @see enFecha
 * @see agruparDatos
 * @see promedioPrediccion
 * @see insertarDatos
 */
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

/**
 * Inserta los datos recibidos y procesados en el documento. Si la estructura de
 * elementos HTML no existe se crea dinámicamente. Si existe se inserta la información
 * en la estructura.
 * @param {Array} datos procesados a ingresar en la página
 * @returns {void}
 * @see modificarDatos
 * @see crearEstructuraDatos
 */
function insertarDatos(datos) {
    let eDestino = document.querySelectorAll('div.widget');
    if (eDestino.length) {
        modificarDatos(datos);
    } else {
        let aside = document.querySelector('aside.clima');
        datos.map(crearEstructuraDatos).forEach(a => aside.appendChild(a));
    }
}

/**
 * Inserta los datos recibidos y procesados en la estructura HTML del documento.
 * @param {Array} datos a insertar en la estructura de elementos.
 * @returns {void}
 */
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
        eDestino[i].querySelector('div.nubes').textContent = `clouds: ${datos[i].nubes}, ${datos[i].presion}`;
    }
}

/**
 * Crea la estructura de elementos HTML donde insertar la información del tiempo
 * recibida por la API.
 * @param {Object} objeto datos a ingresar en la estructura.
 * @returns {Element} elemento HTML con la estructura para los datos.
 * @see crearElemento
 */
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
    let eNubes = crearElemento('DIV', 'nubes', `clouds: ${nubes}, ${presion}`);

    eValores.appendChild(eTemps);
    eValores.appendChild(eViento);
    eValores.appendChild(eNubes);
    widget.appendChild(eMain);
    widget.appendChild(eValores);
    return widget;
}

/**
 * Realiza una desestructuración del objeto de predicción diaria recibido desde 
 * la API para montar y devolver un objeto con la información a mostrar.
 * @param {Object} objeto con la información en bruto recibida desde la API.
 * @returns {Object} objeto con la información que se necesita mostrar.
 */
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

/**
 * Realiza una desestructuración del objeto de predicción de tres días recibido 
 * desde la API para montar y devolver un objeto con la información a mostrar.
 * @param {Object} objeto objeto con la información en bruto recibida desde la API.
 * @returns {Object} objeto con la información que se necesita mostrar.
 */
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

/**
 * Comprueba si el objeto que recibe por parámetro contiene la fecha de alguno de
 * los dos días posteriores.
 * @param {Object} objeto sobre el que comprobar la fecha.
 * @returns {Boolean} <code>true</code> si el objeto está dentro de las fechas;
 * false en caso contrario.
 */
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

/**
 * Devuelve el día del mes de la fecha que recibe por parámetro.
 * @param {String} a cadena que representa la fecha.
 * @returns {Number} día del mes que contiene la fecha pasada por parámetro.
 */
const getDia = a => new Date(a).getDate();

/**
 * Extrae del array que recibe los objetos con la misma fecha y los agrupa en un
 * array. Cada uno de los array se inserta en otro array que es devuelto por la 
 * función.
 * @param {Array} datos array de objetos a clasificar.
 * @returns {Array} de dos posiciones con un array de objetos de la predicción.
 */
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

/**
 * Realiza un promedio de las predicciones periódicas de cada día para hacer una
 * sola predicción para todo el día. Se obtienen las temperaturas máxima y mínima,
 * se hallan las medias de viento, nubes y presión y el resto de valores que más
 * aparecen en las predicciones parciales.
 * @param {Array} array con las predicciones parciales del día.
 * @returns {Object} con la media de valores de la predicción.
 * @see masRepetido
 * @see getIcono
 */
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

/**
 * Devuelve un formato de fecha específico (día_semana día-mes mes) para mostar 
 * en la predicción.
 * @param {String} texto cadena de texto con la fecha a modificar.
 * @returns {String} cadena de texto con el formato de fecha específico.
 */
function montarFecha(texto) {
    let meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let dias = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let fecha = new Date(texto);
    let diaNum = fecha.getDate();
    let diaTxt = dias[fecha.getDay()];
    let mes = meses[fecha.getMonth()];
    return `${diaTxt} ${diaNum} ${mes}`;
}

/**
 * Determina y devuelve el valor más repetido dentro de un array de valores de 
 * cualquier tipo.
 * @param {Array} array para determinar el valor más repetido.
 * @returns {Object} valor más repetido en el array.
 */
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
 * Determina y devuelve el icono a mostrar en la prediccion en función de las 
 * variables que lo determinan en la API.
 * @param {String} grupo meterológico en que se encuadra la predicción, como 'Tormenta',
 * 'Lluvia', 'Nieve' u otros.
 * @param {String} codigo identificador dentro del grupo, para distintos tipos de
 * intensidad del fenómeno meteorológico concreto (501 - lluvia moderada).
 * @param {String} luz determina si es de día o de noche ('d' o 'n').
 * @returns {String} cadena de texto con el nombre y extensión del archivo de icono.
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

/**
 * Crea un elemento HTML con un atributo <code>class</code> y una cadena de texto
 * como <code>TextNode</code> si recibe este parámetro.
 * @param {String} etiqueta nombre de la etiqueta HTML del elemento a crear.
 * @param {String} clase nombre de la clase a aplicar al elemento.
 * @param {String} texto a incluir como nodo de texto dentro del elemento.
 * @returns {Element} el elemento creado.
 */
function crearElemento(etiqueta, clase, texto) {
    let elemento = document.createElement(etiqueta);
    elemento.classList.add(clase);
    if (texto) {
        elemento.textContent = texto;
    }
    return elemento;
}

/**
 * Realiza la gestión de los errores que se pudieran producir durante las peticiones
 * XHR de la información.
 * @param {Event} e evento que dispara el elemento.
 * @returns {void}
 */
function gestionarError(e) {
    let eAside = document.querySelector('aside');
    eAside.querySelector('h2').textContent = e;
}
/**
 * Asigna la función <code>inicio</code> al evento <code>load</code> del objeto 
 * <code>window</code>.
 */
window.addEventListener('load', inicio);