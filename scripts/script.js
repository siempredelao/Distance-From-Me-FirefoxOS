// Script.js
// 2013 David Aguiar González

var map, lat, lng, results, ventana, polygon, distance;

$(function(){

	function distancia(lat1, lon1, lat2, lon2){
		var dlat = (lat2 - lat1)*Math.PI / 180;
		var dlon = (lon2 - lon1)*Math.PI / 180;
		
		var sinlat = Math.sin(dlat/2);
		var sinlon = Math.sin(dlon/2);
		
		var a = Math.pow(sinlat, 2) + Math.cos(lat1*Math.PI / 180)*Math.cos(lat2*Math.PI / 180)*Math.pow(sinlon, 2);
		
		var aux;
		if (Math.sqrt(a) < 1.0)
			aux = Math.sqrt(a);
		else
			aux = 1.0;
		
		return 2 * Math.asin(aux) * 6371000;
	}
	
	function formato_numero(numero, decimales, separador_decimal, separador_miles){
		numero = parseFloat(numero);
		if (isNaN(numero)){
			return "";
		}

		if (decimales !== undefined){
			// Redondeamos
			numero = numero.toFixed(decimales);
		}

		// Convertimos el punto en separador_decimal
		numero = numero.toString().replace(".", separador_decimal!==undefined ? separador_decimal : ",");

		if (separador_miles){
			// Añadimos los separadores de miles
			var miles = new RegExp("(-?[0-9]+)([0-9]{3})");
			while (miles.test(numero)) {
				numero = numero.replace(miles, "$1" + separador_miles + "$2");
			}
		}

		return numero;
	}
	
	function normalizarKm(measure){
		if (measure >= 1000.0){
			measure /= 1000.0;
			return formato_numero(measure, 2, ",", ".").concat(" km")
		} else {
			return formato_numero(measure, 2, ",", ".").concat(" m");
		}
	}
	
	function normalizarMi(measure){
		if (measure >= 1609.344){
			measure /= 1609.344;
			return formato_numero(measure, 2, ".", ",").concat(" mi")
		} else {
			return formato_numero(measure*1.093613298337708, 2, ".", ",").concat(" yd");
		}
	}
	
	// Aquí se supone que habría que pasarle si es en km o mi
	// Lo pasamos por un regex
	function normalizar(distancia){
		if ($('input[name="unidad"]:checked').val() === "km")
			distance = normalizarKm(distancia);
		else
			distance = normalizarMi(distancia);
	}
	
	function enlazarMarcador(e){
		map.removePolylines();
		map.removeMarkers();
		// muestra ruta entre marcas anteriores y actuales
		map.drawPolyline({
				path: [[lat, lng], [e.latLng.lat(), e.latLng.lng()]],
				strokeColor: '#00ff00',
				strokeOpacity: 1.0,
				strokeWeight: 4
		});

		map.addMarker({ lat: lat, lng: lng });  // pone marcador en posición actual
		
		normalizar(distancia(lat, lng, e.latLng.lat(), e.latLng.lng()));
		
		ventana = new google.maps.InfoWindow({content: '<div style="line-height:1.35; overflow:hidden; white-space:nowrap;">'.concat(distance)});
		var marcador = map.addMarker({ lat: e.latLng.lat(),
						lng: e.latLng.lng(),
						infoWindow: ventana
						// draggable: true // mirar cómo hacer esto!
						});  // pone marcador en destino
		ventana.open(map, marcador);	
	};
	
	function enlazarBusqueda(latit, longit, dir){
		map.removePolylines();
		map.removeMarkers();
		// muestra ruta entre marcas anteriores y actuales
		map.drawPolyline({
				path: [[lat, lng], [latit, longit]],
				strokeColor: '#00ff00',
				strokeOpacity: 1.0,
				strokeWeight: 4
		});

		map.addMarker({ lat: lat, lng: lng });  // pone marcador en posición actual
		
		normalizar(distancia(lat, lng, latit, longit));
		
		ventana = new google.maps.InfoWindow({content: '<div style="line-height:1.35; overflow:hidden; white-space:nowrap;">'.concat(dir.concat("<br/>", distance, '</div>'))});
		var marcador = map.addMarker({ lat: latit,
						lng: longit,
						infoWindow: ventana
						// draggable: true // mirar cómo hacer esto!
						});  // pone marcador en destino
		ventana.open(map, marcador);
		
		map.setCenter(latit, longit);
	};

	// Llamada inicial
	function geolocalizar(){
		GMaps.geolocate({
				success:
					function(position){
						lat = position.coords.latitude;  // guarda coords en lat y lng
						lng = position.coords.longitude;

						map = new GMaps({  // muestra mapa centrado en coords [lat, lng]
								el: '#map',
								lat: lat,
								lng: lng,
								click: enlazarMarcador,
								tap: enlazarMarcador,
								mapTypeControl: true
						});
						map.addMarker({ lat: lat, lng: lng});  // marcador en [lat, lng]
					},
				error:
					function(error){
						alert('Geolocation failed: ' + error.message);
					},
				not_supported:
					function(){
						alert("Your browser does not support geolocation");
					},
		});
	};
	
	$("#inicializar").on('click', geolocalizar);
	$("#inicializar").on('tap', geolocalizar);
	
	$('#busqueda').submit(function(e){
		e.preventDefault();
		GMaps.geocode({
			address: $('#abuscar').val().trim(),
			callback: function(results, status){
				if (status == 'OK'){
					var latlng = results[0].geometry.location;
					enlazarBusqueda(latlng.lat(), latlng.lng(), results[0].formatted_address);
				}
			}
		});
	});
	
	// Llamada inicial
	geolocalizar();
	
});