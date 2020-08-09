import React, { useRef, useEffect } from 'react';
import './App.css';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';


const groupBy = function (arr, criteria) {
  return arr.reduce(function (obj, item) {
    var key = item[criteria];
    if (!obj.hasOwnProperty(key)) {
      obj[key] = [];
    }
    obj[key].push(item);
    return obj;
  }, {});
};

const App = () => {
  const mapContainerRef = useRef(null);
  // const [data, setData] = useRef([])

  useEffect(() => {
    axios.get('https://thingproxy.freeboard.io/fetch/https://aoe2.net/api/leaderboard?game=aoe2de&leaderboard_id=3&start=1&count=100')
      .then(({ data }) => {
        console.log(groupBy(data.leaderboard, 'country'))
      })
  });

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [-76.679, -12.045],
      zoom: 1.5,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    return () => map.remove();
  }, []);

  return (
    <div className="map-container" ref={mapContainerRef} />
  );
}

export default App;
