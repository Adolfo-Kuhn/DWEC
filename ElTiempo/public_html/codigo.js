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
 * @returns {Promise} promesa con el resultado de la petición o el error correspondiente.
 */
function peticionXHR(url) {
    // se devuelve una promesa de la petición xhr
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest(); // se crea el objeto
        xhr.onload = () => { // en el evento load
            if (xhr.status === 200) { // si el estado de la respuesta es exitoso
                // la promesa es exitosa y devuelve la respuesta parseada
                resolve(JSON.parse(xhr.responseText));
            } else { // si no la promesa es fallida y devuelve el error
                reject(xhr.statusText);
            }
        };
        xhr.onerror = () => { // en el evento error
            reject(xhr.statusText); // la promesa es fallida y devuelve el error
        };
        xhr.open('GET', url, true); // se monta la petición
        xhr.send(null); // y se envía
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
    // asigna el mapa a la imagen para que se reconozcan las areas definidas
    document.getElementsByTagName('img')[0].setAttribute('usemap', '#sevilla');
    let mapa = document.createElement('MAP'), area;
    mapa.setAttribute('name', 'sevilla');
    for (let i = 0; i < datos.length; i++) {
        // se obtienen las propiedades de cada objeto
        let {nombre, coord, id} = datos[i];
        // y se añaden como propiedades de cada elemento area
        area = document.createElement('AREA');
        area.setAttribute('shape', 'rect');
        area.setAttribute('alt', nombre);
        area.setAttribute('coords', coord);
        area.setAttribute('data-city-id', id);
        // y se les asigna una función a su evento 'click'
        area.addEventListener('click', e => pedirCiudad(e));
        mapa.appendChild(area);
    }
    document.querySelector('.mapa').appendChild(mapa);
    /* se crea un nuevo evento click y se dispara sobre el area de Sevilla
     para que se muestre tras la carga de la página*/
    let pulsar = new MouseEvent('click');
    document.querySelector('area[alt=Sevilla]').dispatchEvent(pulsar);
}

/**
 * Realiza la petición de información para la localidad asociada al elemento 
 * <code>area</code> que dispara el evento. Inserta un elemento <code>H2</code>
 * con el nombre de la localidad en caso de que no existiera, o inserta solo el
 * texto en caso de que existiera. Se realizan peticiones encadenadas para que se
 * muestra toda la información o ninguna. Tras recibir los datos, los pasa a una
 * función para su tratamiento. Muestra y oculta un icono de proceso de carga 
 * mientras se realizan las peticiones y se obtienen las respuestas mediante
 * sendas funciones.
 * @param {Event} e evento que se ha disparado en el elemento.
 * @returns {void}
 * @see peticionXHR
 * @see gestionarDatos
 * @see mostrarIconoCarga
 * @see ocultarIconoCarga
 */
function pedirCiudad(e) {
    // identificador de la ciudad del elemento que dispara el evento
    let idCiudad = e.target.dataset.cityId;
    // código de validación de la API
    let appId = '123bd783ca7ed95d18f949ea84051a1c';
    // cadena con la parte común de la URL
    let sRestURL = 'http://api.openweathermap.org/data/2.5/';
    // cadenas con las partes de la predicción del día actual y los dos posteriores
    let sHoy = `weather?id=${idCiudad}&appid=${appId}&units=metric&lang=es`;
    let sOtros = `forecast?id=${idCiudad}&appid=${appId}&cnt=24&units=metric&lang=es`;
    
    let eHeader = document.querySelectorAll('h2');
    if (eHeader.length) { // si existe el encabezado se modifica
        eHeader[0].textContent = e.target.alt;
    } else { // si no se crea
        eHeader = document.createElement('H2');
        eHeader.textContent = e.target.alt;
        document.querySelector('aside.clima').appendChild(eHeader);
    }
    mostrarIconoCarga(); // se muestra el icono de proceso de carga
    let datos = []; // array en el que almacenar los datos recibidos
    // petición de la predicción para el día en curso
    let promesa1 = peticionXHR(`${sRestURL}${sHoy}`);
    promesa1.then(data => { // si la respuesta es satisfactoria
        datos.push(data); // se introducen los datos en el array
        // y se devuelve otra promesa de petición
        return peticionXHR(`${sRestURL}${sOtros}`);
    })
    .then(data => { // si la respuesta es satisfactoria
        datos.push(data); // se introducen los datos en el array
        ocultarIconoCarga(); // se oculta el icono de proceso de carga
        gestionarDatos(datos); // y se envian los datos para ser tratados
    })
    // si cualquiera de las promesas es fallida se trata el error
    .catch(gestionarError);
}

/**
 * Prepara los datos recibidos desde la OpenWeather API y los agrupa en un array 
 * de tres objetos conteniendo la información.
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
    // se nombran las dos posiciones del array recibido; cada una es un objeto
    let [oHoy, oOtros] = datos;
    // se crea un nuevo array para devolver los datos tratados a una función
    let widgetsInfo = [];
    // se inserta en el array el objeto del día en curso con la estructura deseada
    widgetsInfo.push(destructurarHoy(oHoy));
    // se obtiene el array guardado en la propiedad 'list' del segundo objeto
    let {list} = oOtros;
    /* se obtiene un array con la estructura de datos deseada en cada objeto y 
     pertenecientes a las fechas de los dos días posteriores */
    let listado = list.map(destructurarOtros).filter(enFecha);
    agruparDatos(listado) // se agrupan los objetos por fecha
        .map(promedioPrediccion) // se saca un promedio de la predicción
        .forEach(a => widgetsInfo.push(a)); // y se añaden los objetos al array
    // se pasan los datos a la función insertarDatos
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
        let eAside = document.querySelector('aside.clima');
        datos.map(crearEstructuraDatos)
            .forEach(a => eAside.appendChild(a));
    }
}

/**
 * Inserta los datos recibidos y procesados en la estructura HTML del documento.
 * Se recorren en bucle cada una de las estructuras ('widgets') que muestran la
 * información de las predicciones y se modifican sus contenidos con los datos
 * recibidos por parámetro.
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
    // se obtienen las propiedades del objeto
    let {fecha, icono, maxima, minima, leyenda, viento, nubes, presion} = objeto;
    let widget = crearElemento('DIV', 'widget'); // se crea el 'div' principal
    // se crea el elemento contenedor de la fecha y el icono
    let eMain = crearElemento('DIV', 'mainIcono', fecha);
    eMain.style.background = `url(http://openweathermap.org/img/w/${icono}) no-repeat right`;
    // se crea el elemento que contiene los valores numéricos
    let eValores = crearElemento('DIV', 'valores');
    // se crea otro contenedor para las temperaturas
    let eTemps = crearElemento('DIV', 'temperaturas');
    // que se incluyen en elementos 'span' para aplicar estilos
    eTemps.appendChild(crearElemento('SPAN', 'tempMax', maxima));
    eTemps.appendChild(crearElemento('SPAN', 'tempMin', minima));
    eTemps.appendChild(crearElemento('SPAN', 'leyenda', leyenda));
    // se crean los elementos para valores de viento y nubes/presión
    let eViento = crearElemento('DIV', 'viento', viento);
    let eNubes = crearElemento('DIV', 'nubes', `clouds: ${nubes}, ${presion}`);
    // se insertan en el 'widget' todos los elementos
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
 * los dos días posteriores. Esta función se utiliza en una de orden superior para
 * filtrar objetos con fechas determinadas.
 * @param {Object} objeto sobre el que comprobar la fecha.
 * @returns {Boolean} <code>true</code> si el objeto está dentro de las fechas;
 * <code>false</code> en caso contrario.
 */
function enFecha(objeto) {
    let hoy = new Date(Date.now()); // se obtiene la fecha de hoy
    let maniana = new Date();
    maniana.setDate(hoy.getDate() + 1); // la de mañana
    let pasado = new Date();
    pasado.setDate(hoy.getDate() + 2); // la de pasado
    let fechaObjeto = new Date(objeto.fecha); // y la del objeto
    // si la fecha del objeto es igual a la de mañana o pasado se devuelve true
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
 * array. Cada uno de estos array se inserta en otro array que es devuelto por la 
 * función.
 * @param {Array} datos array de objetos a clasificar.
 * @returns {Array} array de dos posiciones con un array de objetos de la 
 * predicción cada una.
 */
function agruparDatos(datos) {
    // toma la fecha del primer objeto del array
    let fecha = getDia(datos[0].fecha);
    let dias = [], grupo = [];
    for (let i = 0; i < datos.length; i++) {
        // si la fecha del primer objeto concuerda con la de la muestra
        if (getDia(datos[i].fecha) === fecha) {
            grupo.push(datos[i]); // se guarda en el array grupo
            // y se actualiza la fecha a comparar con la del objeto actual
            fecha = getDia(datos[i].fecha);
        } else { // si la fecha es distinta a la de la muestra
            dias.push(grupo); // se guarda el array grupo dentro del array dias
            grupo = []; // se inicializa el array grupo como vacío
            grupo.push(datos[i]); // se añade el objeto actual al array grupo
            // y se actualiza la fecha a comparar con la del objeto actual
            fecha = getDia(datos[i].fecha);
        }
    }
    dias.push(grupo); // se añade el último grupo al array dias
    return dias; // y se devuelve
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
    let maxima = -100, minima = 100, viento = 0,
            nubes = 0, presion = 0, n = array.length;
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
 * en la predicción. Extrae del texto que recibe por parámetro el día de la semana, 
<<<<<<< HEAD
 * el día del mes y el mes para mostrarlo en el formato deseado.
 * @param {String} texto cadena con la fecha a modificar.
 * @returns {String} cadena con el formato de fecha específico.
=======
 * el día del mes y el mes para mostrarlo en el formato 'DíaSemana DíaMes Mes'.
 * @param {String} texto cadena de texto con la fecha a modificar.
 * @returns {String} cadena de texto con el formato de fecha específico.
>>>>>>> bf19f9498e9dd9769d5a37b9a9680970dcd62b55
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
 * cualquier tipo. Devuelve el primero de los valores más repetido en el array
 * al determinarse por el índice.
 * @param {Array} array para determinar el valor más repetido.
 * @returns {Object} valor más repetido en el array.
 */
function masRepetido(array) {
    // se almacenan los valores y las veces que se repiten de arrays paralelos
    let valor = [], cantidad = [];
    // se recorre el array original
    for (let i = 0; i < array.length; i++) {
        if (valor.includes(array[i])) { // si el array de valores contien el valor
            // se incrementa en uno la misma posición en el array paralelo
            cantidad[valor.indexOf(array[i])]++;
        } else { // si el array de valores no contiene el valor
            valor.push(array[i]); // se añade al array de valores
            // y se inidican sus apariciones como 1 en el array paralelo
            cantidad.push(1);
        }
    }
    // se hace copia ordenada de mayor a menor del array de apariciones 
    let ordenado = Array.from(cantidad).sort().reverse();
    // se devuelve el valor que se encuentra en el índice que tiene más apariciones
    return valor[cantidad.indexOf(ordenado[0])];
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
 * Muestra un icono de carga mientras se reciben los datos de las peticiones.
 * Inserta un elemento <code>div</code> con un elemento hijo <code>img</code> con
 * la imagen del icono de carga de datos en el elemento en que se muestran las
 * predicciones. Si el elemento ya existe se establece su propiedad <code>display</code> 
 * como <code>block</code> para que se muestre, ya que se habría ocultado previamente 
 * al realizarse la anterior carga de datos.
 * @returns {void}
 */
function mostrarIconoCarga() {
    let eClima = document.querySelector('aside.clima');
    let eCajaIcono = document.querySelector('div.cajaIcono');
    if (eCajaIcono) {
        eCajaIcono.style.display = 'block';
    } else {
        eCajaIcono = document.createElement('DIV');
        eCajaIcono.classList.add('cajaIcono');
        let eIcono = document.createElement('IMG');
        eIcono.setAttribute('src', 'img/Carga.gif');
        eIcono.setAttribute('alt', 'Cargando datos...');
        eCajaIcono.appendChild(eIcono);
        eClima.appendChild(eCajaIcono);
    }
}

/**
 * Oculta el elemento que contiene el icono de carga una vez que se ha completado
 * la carga de los datos peticionados. Para ello asigna a la propìedad <code>display</code>
 * del elemento el valor <code>none</code>.
 * @returns {void}
 */
function ocultarIconoCarga() {
    let eCajaIcono = document.querySelector('div.cajaIcono');
    if (window.getComputedStyle(eCajaIcono).display.includes('block')) {
        eCajaIcono.style.display = 'none';
    }
}

/**
 * Crea un elemento HTML con un atributo <code>class</code> y una cadena de texto
 * como <code>TextNode</code>, si recibe este último parámetro.
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
 * <code>window</code> para que se ejecute cuando la página haya cargado completamente.
 */
window.addEventListener('load', inicio);
