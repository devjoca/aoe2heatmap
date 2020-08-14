import React, { useRef, useEffect } from 'react';
import { scaleQuantile } from "d3-scale";
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import useSWR from 'swr';
import chroma from 'chroma-js';

import './App.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCES_TOKEN;

const summarizeData = function (arr) {
  const data = arr.reduce(function (obj, profile) {
    var key = profile['country'];
    if (!obj.hasOwnProperty(key)) {
      obj[key] = {};
      obj[key]['players'] = [];
      obj[key]['totalRatings'] = 0;
    }
    obj[key]['players'].push(profile);
    obj[key]['totalRatings'] += profile.rating;
    return obj;
  }, {})

  for (const [key, value] of Object.entries(data)) {
    data[key].avgRating = value.totalRatings / value.players.length
  }

  return data
};

const fetcher = url => {
  return axios.get(url)
    .then(({ data }) => {
      return summarizeData(data.leaderboard);
    })
}

const App = () => {
  const mapContainerRef = useRef(null);
  const { data } = useSWR('/.netlify/functions/aoe2api', fetcher)

  useEffect(() => {
    if (data) {
      const colorScale = scaleQuantile()
        .domain(Object.keys(data).map(k => data[k].avgRating))
        .range(
          chroma.scale('YlOrRd')
            .mode('lch').colors(9)
        );
      var expression = ['match', ['get', 'ISO_A2']];

      for (const key in data) {
        expression.push(key, colorScale(data[key].avgRating))
      }
      expression.push(colorScale(0))

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
            'fill-color': expression,
          },
        });
      });

      map.on('click', 'countries', (mapEl) => {
        console.log(mapEl.features[0])
      });

      return () => map.remove();
    }

  }, [data]);

  return (
    <div className="map-container" ref={mapContainerRef} />
  );
}

export default App;
