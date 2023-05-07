import * as d3 from 'd3'
import * as topojson from 'topojson-client'

import countriesJson from '../data/ne_110m_countries.json'
import placesJson from '../data/ne_110m_places.json'

const world = topojson.feature(countriesJson, countriesJson.objects.countries)
const graticule = d3.geoGraticule()()

const countryLabels = topojson.feature(countriesJson, countriesJson.objects.countries)
const placesLabels = topojson.feature(placesJson, placesJson.objects.places)

const DensityChart = function () {
    let width = 460;
    let height = 400;
    let margin = {top: 20, right: 30, bottom: 30, left: 40};

    function my (selection) {
        if (!selection) return;
        selection.each(function (data, i) {
            // data = data.filter(d => {
            //     return d.Longitude >= -15 && d.Longitude <= 60 && d.Latitude <= 70 && d.Latitude >= 30
            // })
            const svg = d3.select(this)
                .selectAll('svg.main')
                .data(['once'])
                .join('svg')
                .attr('class', 'main')
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            const top = svg.selectAll('g.top')
                .data(['once'])
                .join('g')
                .attr('class', 'top')
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")")

            var x = d3.scaleLinear()
                .domain([5, 20])
                .range([ 0, width ])

            var y = d3.scaleLinear()
                .domain([5, 22])
                .range([ height, 0 ])

            var projection = d3.geoEquirectangular()
            projection.fitSize([width, height], world)

            var geoPath = d3.geoPath().projection(projection)

            let theMap = top.selectAll('.geomap').data(['once']);
            theMap = theMap.enter()
                .append('g')
                .attr('class', 'geomap')
                .merge(theMap)

            // add map features
            let mapg = theMap.selectAll('.map').data(['once']);
            mapg = mapg.enter()
                .append('g').attr('class', 'map')
                .merge(mapg);

            // map labels are added on top of all other features
            let maplg = theMap.selectAll('.map-labels').data(['once']);
            maplg = maplg.enter()
                .append('g').attr('class', 'map-labels')
                .merge(maplg);

            const domain = d3.extent(data, d => d.LimitingMag)
            // const color = d3.scaleLinear()
            //     .domain(domain)
            //     .range([d3.rgb('#FD8F6F'), d3.rgb('#4C1603')])
            const color = d3.scaleSequential(domain, d3.interpolateMagma)

            // then data points
            let nodesg = theMap.selectAll('.points').data(['once']);
            nodesg = nodesg.enter()
                .append('g').attr('class', 'points')
                .merge(nodesg)

            // add/update points
            const njoin = nodesg.selectAll('.point')
                .data(data, d => d.id)
            njoin.exit().remove()

            njoin.enter()
                .append('circle')
                .attr('class', 'point')
                .attr('r', 3)
                .attr('cx', d => projection([d.Longitude, d.Latitude])[0])
                .attr('cy', d => projection([d.Longitude, d.Latitude])[1])
                .attr('fill', d => color(d.LimitingMag))
                .merge(njoin)

            // add features
            const fjoin = mapg.selectAll('.feature')
                .data([world, graticule], d => d.type)
            fjoin.enter()
                .append('path').attr('class', d => 'feature ' + d.type)
                .merge(fjoin)
                .attr('d', geoPath)

            // add labels
            const labels = [countryLabels, placesLabels]
            const clabelsjoin = maplg.selectAll('.feature-label.countries')
                .data(countryLabels.features
                    .filter(d => d.properties.LABELRANK < 1), d => d.id)
            clabelsjoin.enter()
                .append('text').attr('class', 'feature-label countries')
                .merge(clabelsjoin)
                .attr('dy', '.35em')
                .attr('pointer-events', 'none')
                .attr('transform', d => `translate(${geoPath.centroid(d)})`)
                .text(d => d.id)

            const plabelsjoin = maplg.selectAll('.feature-label.places')
                .data(placesLabels.features
                    .filter(d => d.properties.LABELRANK < 1), d => d.id);
            plabelsjoin.enter()
                .append('text').attr('class', 'feature-label places')
                .merge(plabelsjoin)
                .attr('dy', '.35em')
                .attr('pointer-events', 'none')
                .attr('transform', d => `translate(${geoPath.centroid(d)})`)
                .text(d => d.id)


            // //***************************
            // // map labels are added on top of all other features
            // let experimentg = theMap.selectAll('.experiment').data(['once']);
            // experimentg = experimentg.enter()
            //     .append('g').attr('class', 'experiment')
            //     .merge(experimentg);
            //
            // // range longitudes from 10 (S) to 55 (N) for every 1 degree
            // const lons = d3.range(-90, 90, 10).reverse()
            //
            // // range latitudes from -130 (W) to -60 (E) for every 1 degree
            // const lats = d3.range(-180, 180, 10)
            // const rawPoints = lons.map((lon, i) => lats.map(lat => [lat, lon])).flat()
            //
            // // const rawPoints = data.map(d => ([d.Latitude, d.Longitude]))
            //
            // // const geoJson = rawPoints.map((d,i) => {
            // //     return {
            // //         "type": "Feature",
            // //         "geometry": {
            // //             "type": "Point",
            // //             "coordinates": d
            // //         },
            // //         "properties": {
            // //             "index": i
            // //         }
            // //     }
            // // });
            // //
            // // const expJoin = experimentg.selectAll('.feature-label.dots')
            // //     .data(geoJson);
            // // expJoin.enter()
            // //     .append('circle').attr('class', 'feature-label dots')
            // //     .merge(expJoin)
            // //     .attr('r', 1)
            // //     .attr('transform', d => `translate(${geoPath.centroid(d)})`)
            // //     .attr('fill', 'pink')
            //
            // // data.sort((a, b) => {
            // //     if (a.Longitude == b.Longitude) return a.Latitude - b.Latitude
            // //     return a.Longitude - b.Longitude
            // // })
            //     const voronoiPoints = rawPoints.map(d => climateFeatures[climateVoronoi.find(...d)].properties.CLIMDIV)
            //     const voronoiLookup = voronoiPoints.map((d, i) => [i, d])
            //
            // const tempChangeLookup = Math.random() * 2
            //
            // get_point_data = (d, i) => {
            //     let data = null
            //
            //     // this limits the data to the regions in or close to the US.
            //     if (d3.geoContains(statesGeo, d) || d3.geoContains(bufferGeo, d)) {
            //         data = +tempChangeLookup.get(voronoiLookup.get(i)) * 10
            //     }
            //
            //     return data
            // }
            //
            // const gridPoints = data.map((d,i) => ({
            //     'centroid': projection([d.Longitude, d.Latitude]),
            //     'data': get_point_data(point, i)
            // })).filter(d => d.centroid !== null && d.data !== null)
            //
            // const offset = d3.min(data, d=>d.LimitingMag) * 10
            //
            // const contour_data = gridPoints.reduce((acc, climdiv) => {
            //
            //     // calculate the number of points based on the temp change value, down to 0.1.
            //     const num_points = Math.floor(Math.abs(climdiv.data  + offset))
            //
            //     // create an array of that same value repeated to create stacked points tied to the data value
            //     const array = new Array(num_points).fill(climdiv.centroid, 0, num_points)
            //
            //     return [...acc, ...array]
            // }, [])
            //
            // const contour = d3.contourDensity()
            //     .x(d => d[0])
            //     .y(d => d[1])
            //     // .thresholds(d3.range(50, 1200, 100))
            //     .size([width, height])
            //     .cellSize(2)
            //
            // console.log(contour_data);
            //
            // const contours = contour(contour_data)
            // console.log(contours)
            //
            // let contoursg = theMap.selectAll('.contours').data(['once']);
            // contoursg = contoursg.enter()
            //     .append('g').attr('class', 'contours')
            //     .merge(contoursg)
            //
            // const contourColor = d3.scaleSequential(d3.extent(contours, d => d.value), d3.interpolateMagma)
            //
            //
            // const djoin = contoursg.selectAll('path.contour')
            //     .data(contours)
            // djoin.enter()
            //     .append('path')
            //     .attr('class', d => `contour ${d.value}`)
            //     .attr("d", geoPath)
            //     .attr("fill", d => {
            //         // return contourColor(d.value)
            //         return 'none'
            //     })
            //     .attr("stroke", "#69b3a2")
            //     .attr("stroke-linejoin", "round")
            //     .merge(djoin)
            // //***************************









            const gridPoints = data.map((d,i) => ({
                point: projection([d.Longitude, d.Latitude]),
                value: d.LimitingMag,
            }))

            const data1 = data.filter(d => d.LimitingMag <= 1)
            console.log(data1)
            const dataPoints1 = data1.reduce((a, c) => {
                // create an array of that same value repeated to create stacked points tied to the data value
                const array = new Array(c.LimitingMag)
                    .fill(projection([c.Longitude, c.Latitude]), 0, c.LimitingMag)

                return [...a, ...array]
            }, [])
            console.log(dataPoints1)
            // const contour1 = d3.contours()
            //     .size([2, dataPoints1.length])
            //     .contour(dataPoints1, 0)
            // console.log(contour1)


            const contours = d3.contourDensity()
                // .x(d => projection([d.Longitude, d.Latitude][0]))
                // .y(d => projection([d.Longitude, d.Latitude][1]))
                .x(d => d[0])
                .y(d => d[1])
                .thresholds(1)
                // .size([2, dataPoints1.length])
                // .bandwidth(7)
                // .thresholds(7)
                // .cellSize(32)

            const contourData = contours(dataPoints1)
            const contourColor = d3.scaleSequential(d3.extent(contourData, d => d.value), d3.interpolateMagma)

            console.log(contourData)
            // the contours
            let contoursg = theMap.selectAll('.contours').data(['once']);
            contoursg = contoursg.enter()
                .append('g').attr('class', 'contours')
                .merge(contoursg)

            const djoin = contoursg.selectAll('path.contour')
                .data(contourData)
            djoin.enter()
                .append('path')
                .attr('class', d => `contour ${d.value}`)
                .attr("d", geoPath)
                .attr("fill", d => {
                    // return contourColor(d.value)
                    return 'none'
                })
                .attr("stroke", "#69b3a2")
                .attr("stroke-linejoin", "round")
                .merge(djoin)
        });
    }

    my.width = function (v) {
        width = v;
        return my;
    };

    my.height = function (v) {
        height = v;
        return my;
    };

    my.margin = function (v) {
        margin = v;
        return my;
    };

    return my;
};

export default DensityChart;
