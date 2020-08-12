import React, { useRef, useEffect } from 'react';
import { scaleQuantile } from "d3-scale";
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import useSWR from 'swr';

import './App.css';

const summarizeData = function (arr) {
  return arr.reduce(function (obj, profile) {
    var key = profile['country'];
    if (!obj.hasOwnProperty(key)) {
      obj[key] = {};
      obj[key]['players'] = [];
      obj[key]['totalRatings'] = 0;
    }
    obj[key]['players'].push(profile);
    obj[key]['totalRatings'] += profile.rating;
    return obj;
  }, {});
};

const fetcher = url => {
  return axios.get('https://thingproxy.freeboard.io/fetch/https://aoe2.net/api/leaderboard?game=aoe2de&leaderboard_id=3&start=1&count=100')
    .then(({ data }) => {
      return summarizeData(data.leaderboard);
    })
}

const App = () => {
  const mapContainerRef = useRef(null);
  const { data } = useSWR('https://thingproxy.freeboard.io/fetch/https://aoe2.net/api/leaderboard?game=aoe2de&leaderboard_id=3&start=1&count=100', fetcher)


  useEffect(() => {
    if (data) {
      const colorScale = scaleQuantile()
        .domain(Object.keys(data).map(k => data[k].totalRatings / data[k].players.length))
        .range([
          "#ffedea",
          "#ffcec5",
          "#ffad9f",
          "#ff8a75",
          "#ff5533",
          "#e2492d",
          "#be3d26",
          "#9a311f",
          "#782618"
        ]);

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [-82.366592, 23.113592],
        zoom: 2,
      });
      map.on('load', function () {
        map.addLayer({
          id: 'countries',
          source: {
            type: 'vector',
            url: 'mapbox://jopereyral.3qrx3sp4',
          },
          'source-layer': 'ne_10m_admin_0_countries-3iszu5',
          type: 'fill',
          paint: {
            "fill-opacity": 0.8,
            'fill-color': colorScale(0),
          },
        });
      });

      map.on('click', 'countries', (mapEl) => {
        console.log(mapEl.features[0])
      });

      // map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
      return () => map.remove();
    }

  }, [data]);

  return (
    <div className="map-container" ref={mapContainerRef} />
  );
}

export default App;
