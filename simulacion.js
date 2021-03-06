var iterador = 20;
var i = 0;
var color = "green";
var distanciaMedia = 0;
var poblacionTotal = 0;

function limpiarHTML() {
  document.getElementById("nombreCondado").innerHTML = "";
  document.getElementById("poblacionTotal").innerHTML = "";
  document.getElementById("poblacionBuffer").innerHTML = "";
  document.getElementById("areaBuffer").innerHTML = "";
  document.getElementById("areaTotal").innerHTML = "";
}

function determinarColor(distanciaActual) {
  if (distanciaActual >= distanciaMedia) {
    color = "orange";
  } else {
    color = "green";
  }
}
async function simular() {
  var contadorPuntos = 0;
  var distanciaTotal = 0;
  while (i + iterador < rutaSimulacion[0].length) {
    var distancia = calcDistancia(
      rutaSimulacion[0][i][0],
      rutaSimulacion[0][i][1],
      rutaSimulacion[0][i + iterador][0],
      rutaSimulacion[0][i + iterador][1]
    );
    distanciaTotal = distanciaTotal + distancia;
    i = i + iterador;
    contadorPuntos = contadorPuntos + 1;
  }
  //distancia aproximada q se tieneque hacer por cada punto que se compute
  distanciaMedia = distanciaTotal / contadorPuntos;
  //paso a metros
  distanciaMedia *= 1000;
  i = 0;
  while (i + iterador < rutaSimulacion[0].length) {
    capaSimulacion.removeAll();
    poblacionTotal=0;
    var distanciaActual =
      calcDistancia(
        rutaSimulacion[0][i][0],
        rutaSimulacion[0][i][1],
        rutaSimulacion[0][i + iterador][0],
        rutaSimulacion[0][i + iterador][1]
      ) * 1000;
    determinarColor(distanciaActual);
    mapear();
    const sl = await dormir();
    limpiarHTML();
    i = i + iterador;
  }
  capaSimulacion.removeAll();
  i = rutaSimulacion[0].length - 1;
  mapear();
  limpiarHTML();
}

function dormir() {
  return new Promise((resolve) => setTimeout(resolve, 60000));
}
//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function calcDistancia(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
  return (Value * Math.PI) / 180;
}

function mapear() {
  require([
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "esri/geometry/Polygon",
    "esri/geometry/Point",
    "esri/rest/support/Query",
    "esri/layers/FeatureLayer",
    "esri/rest/geometryService",
    "esri/rest/support/AreasAndLengthsParameters",
  ], function (
    GraphicsLayer,
    Graphic,
    Polygon,
    Point,
    Query,
    FeatureLayer,
    geometryService,
    AreasAndLengthsParameters
  ) {
    function pintarCondado(anillito) {
      var poligon = {
        type: "polygon",
        rings: anillito,
      };
      var anillo = {
        type: "simple-fill",
        outline: {
          color: [255, 0, 0],
          width: 4,
        },
      };
      var polygonGraphic = new Graphic({
        symbol: anillo,
        geometry: poligon,
      });
      capaSimulacion.add(polygonGraphic);
    }
    function dibujarCapaSimulacion(indice) {
      var point = {
        type: "point",
        x: rutaSimulacion[0][indice][0],
        y: rutaSimulacion[0][indice][1],
      };

      markerSymbol = {
        type: "simple-marker",
        color: "black",
        size: "10px",
        outline: {
          color: color,
          width: 5.5,
        },
      };
      var graphic = new Graphic({
        geometry: point,
        symbol: markerSymbol,
      });
      capaSimulacion.add(graphic);
    }
    function pintarPoligono(poligono) {
      var poligon = {
        type: "polygon",
        rings: poligono,
      };
      var anillo = {
        type: "simple-fill",
        outline: {
          color: "white",
          width: 1,
        },
      };
      var polygonGraphic = new Graphic({
        symbol: anillo,
        geometry: poligon,
      });
      capaSimulacion.add(polygonGraphic);
    }

    dibujarCapaSimulacion(i);
    //creo buffer
    var bufferRequestUrl = `http://tasks.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer/buffer?geometries=${rutaSimulacion[0][i][0]},${rutaSimulacion[0][i][1]}&inSR=4326&outSR=4326&bufferSR=&distances=0.04&unit=&unionResults=false&geodesic=false&f=json`;
    var requestBuffer = new XMLHttpRequest();
    requestBuffer.open("GET", bufferRequestUrl, false);
    requestBuffer.send(null);
    var respuestaBuffer = {};
    if (requestBuffer.status === 200) {
      respuestaBuffer = JSON.parse(requestBuffer.response);
    }
    var anillo = new Polygon(respuestaBuffer.geometries[0].rings);
    FeatureLayerCondados = new FeatureLayer({
      url: "http://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_1990-2000_Population_Change/MapServer/3",
    });
    var poblacionesCondados = [];
    var nombresCondados =[];
    var condados = [];

    //pinto buffer
    pintarPoligono(respuestaBuffer.geometries[0].rings);
    //busco los condados con los q el buffer intersecta, obtengo info importante de lso condados
    var query = new Query();
    query.returnGeometry = true;
    query.spatialRelationship = "intersects";
    query.outFields = "*";
    query.geometry = anillo;
    query.inputSpatialReference = { wkid: 4326 };
    query.outSpatialReference = { wkid: 4326 };
    FeatureLayerCondados.queryFeatures(query).then(function (response) {
      for (var i = 0; i < response.features.length; i++) {
        pintarCondado(response.features[i].geometry.rings);
        var poblacion = response.features[i].attributes.TOTPOP_CY;
        poblacionesCondados.push(poblacion);
        var condado = new Polygon(response.features[i].geometry);
        condados.push({ rings: condado.rings });
        nombresCondados.push(response.features[i].attributes.NAME);
      }

      var condadosAux = {
        geometryType: "esriGeometryPolygon",
        geometries: [condados[0]],
      };
      var anilloAux = {
        geometryType: "esriGeometryPolygon",
        geometry: {
          rings: anillo.rings,
        },
      };
      //pondero el area.
      var bufferRequestUrl = `https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer/intersect`;
      var params = `sr=4326&geometries=${JSON.stringify(
        condadosAux
      )}&geometry=${JSON.stringify(anilloAux)}&f=pjson`;
      var requestBuffer = new XMLHttpRequest();
      requestBuffer.open("POST", bufferRequestUrl, false);
      requestBuffer.setRequestHeader(
        "Content-type",
        "application/x-www-form-urlencoded"
      );
      requestBuffer.send(params);
      var areaIntersectada = 0;
      var areaCondados = 0;
      var poblacionCondado = 0;
      if (requestBuffer.status === 200) {
        var response = JSON.parse(requestBuffer.response);
        console.log('respuesta', response);
        for (let j = 0; j < response.geometries[0].rings.length; j++) {
          //paintPolygon(results[i].rings);
          var poligonoInterseccion = new Polygon(response.geometries[0].rings[j]);
          var poligonoCondado = new Polygon(condados[j].rings);
          var areasAndLengthParams = new AreasAndLengthsParameters({
             areaUnit: "square-kilometers",
             lengthUnit: "kilometers",
             polygons: [poligonoInterseccion,poligonoCondado]
           });
           console.log(areasAndLengthParams);
           geometryService.areasAndLengths("https://utility.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer",areasAndLengthParams).then(function(results){
            console.log('pua',results);
            areaIntersectada = results.areas[0];
            areaCondado = results.areas[1];
            console.log('iiii', j);
            console.log('ooo', poblacionesCondados[j]);
            poblacionCondado= parseInt(poblacionesCondados[j]);
            var indicePonderacion = parseFloat(areaIntersectada) / parseFloat(areaCondado) ;
            console.log('poblacion condado: ' , poblacionCondado);
            console.log('indice ponderacion: ', indicePonderacion);
            mostrarDatosCondadoOficial(nombresCondados[j], Math.ceil(indicePonderacion * poblacionCondado), poblacionCondado, areaCondado.toFixed(2),areaIntersectada.toFixed(2))
          });
        }
      }
    });
  });
}


function mostrarDatosCondadoOficial(nombre, poblacionBuffer, poblacionCondado, areaCond, areaBuffer) {

  document.getElementById("nombreCondado").innerHTML =
    nombre + " / " + document.getElementById("nombreCondado").innerHTML;
  document.getElementById("poblacionTotal").innerHTML =
    poblacionCondado + " / " + document.getElementById("poblacionTotal").innerHTML;
    document.getElementById("areaTotal").innerHTML =
    areaCond + " / " + document.getElementById("areaTotal").innerHTML;

    document.getElementById("areaBuffer").innerHTML =
    areaBuffer + " / " + document.getElementById("areaBuffer").innerHTML;

    document.getElementById("poblacionBuffer").innerHTML =
    poblacionBuffer + " / " + document.getElementById("poblacionBuffer").innerHTML;
}
