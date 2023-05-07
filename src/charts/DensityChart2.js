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
    const strokeColor = "#69b3a2"

    function my (selection) {
        if (!selection) return;
        selection.each(function (data, i) {
            // data = data.filter(d => {
            //     return d.Longitude >= -15 && d.Longitude <= 60 && d.Latitude <= 70 && d.Latitude >= 30
            // })
            // data = data.filter(d => {
            //     return d.Longitude >= -100 &&
            //         d.Longitude <= -15 &&
            //         d.Latitude <= 20 &&
            //         d.Latitude >= -180
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

            // var projection = d3.geoEqualEarth()
            // var projection = d3.geoEquirectangular()
            // var projection = d3.geoOrthographic()
            // var projection = d3.geoAzimuthalEqualArea()
            // var projection = d3.geoGnomonic()
            var projection = d3.geoConicEqualArea()
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


            // the contours
            let contoursg = theMap.selectAll('.contours').data(['once']);
            contoursg = contoursg.enter()
                .append('g').attr('class', 'contours')
                .merge(contoursg)

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

            // filter for glowing land
            let filter = mapg.selectAll('defs').data([data], d => d.key);
            filter = filter.enter().append('defs')
                .append('filter')
                .attr('id', 'glow');
            filter.append('feGaussianBlur')
                .attr('stdDeviation', '7')
                .attr('result', 'coloredBlur');
            const feMerge = filter.append('feMerge');
            feMerge.append('feMergeNode').attr('in', 'coloredBlur');
            feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

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
            //
            // // compute the density data
            var densityData = d3.contourDensity()
                // .x(d => projection([d.Longitude, d.Latitude])[0])
                // .y(d => projection([d.Longitude, d.Latitude])[1])
                .x(d => d.Longitude)
                .y(d => d.Latitude)
                .size([width, height])
                .bandwidth(5)    // smaller = more precision in lines = more lines
                (data)
            const contourColor = d3.scaleSequential(d3.extent(densityData, d => d.value), d3.interpolateMagma)

            // compute the density data for europe
            const europe = data.filter(d => {
                return d.Longitude >= -15 &&
                    d.Longitude <= 60 &&
                    d.Latitude <= 70 &&
                    d.Latitude >= 30
            })

            var europeDensity = d3.contourDensity()
                // .x(d => projection([d.Longitude, d.Latitude])[0])
                // .y(d => projection([d.Longitude, d.Latitude])[1])
                .x(d => d.Longitude)
                .y(d => d.Latitude)
                .size([width, height])
                .bandwidth(5)    // smaller = more precision in lines = more lines
                (europe)

            // console.log(europeDensity)

            const djoin = contoursg.selectAll('path.europe')
                .data(europeDensity)
            djoin.enter()
                .append('path')
                .attr('class', d => `europe ${d.value}`)
                .attr("d", geoPath)
                .attr('fill-opacity', 0.5)
                .attr("fill", d => {
                    return contourColor(d.value)
                    // return 'none'
                })
                .attr("stroke", strokeColor)
                .attr("stroke-linejoin", "round")
                .merge(djoin)

            // compute the density data for asia
            // 48°09'60.00" N -100°09'60.00" W
            const asia = data.filter(d => {
                return d.Longitude >= 60 &&
                    d.Longitude <= 170 &&
                    d.Latitude <= 43 &&
                    d.Latitude >= 16
            })

            var asiaDensity = d3.contourDensity()
                // .x(d => projection([d.Longitude, d.Latitude])[0])
                // .y(d => projection([d.Longitude, d.Latitude])[1])
                .x(d => d.Longitude)
                .y(d => d.Latitude)
                .size([width, height])
                .bandwidth(10)    // smaller = more precision in lines = more lines
                (asia)

            const asiaColor = d3.scaleSequential(d3.extent(asiaDensity, d => d.value), d3.interpolateMagma)


            const dajoin = contoursg.selectAll('path.asia')
                .data(asiaDensity)
            dajoin.enter()
                .append('path')
                .attr('class', d => `asia ${d.value}`)
                .attr("d", geoPath)
                .attr('fill-opacity', 0.5)
                .attr("fill", d => {
                    return asiaColor(d.value)
                    // return 'none'
                })
                .attr("stroke", strokeColor)
                .attr("stroke-linejoin", "round")
                .merge(dajoin)

            // compute the density data for northAmerica
            // 48°09'60.00" N -100°09'60.00" W
            const northAmerica = data.filter(d => {
                return d.Longitude >= -100 &&
                    d.Longitude <= -20 &&
                    d.Latitude <= 43 &&
                    d.Latitude >= 16
                    // d.Latitude <= 85 &&
                    // d.Latitude >= 25
            })

            console.log(northAmerica)

            var northAmericaDensity = d3.contourDensity()
                .x(d => projection([d.Longitude, d.Latitude])[0])
                .y(d => projection([d.Longitude, d.Latitude])[1])
                // .x(d => d.Longitude)
                // .y(d => d.Latitude)
                .size([width, height])
                .bandwidth(10)    // smaller = more precision in lines = more lines
                (northAmerica)

            console.log(northAmericaDensity)
            const naColor = d3.scaleSequential(d3.extent(northAmericaDensity, d => d.value), d3.interpolateMagma)


            // const dnajoin = contoursg.selectAll('path.north-america')
            //     .data(northAmericaDensity)
            // dnajoin.enter()
            //     .append('path')
            //     .attr('class', d => `north-america ${d.value}`)
            //     .attr("d", geoPath)
            //     .attr('fill-opacity', 0.2)
            //     .attr("fill", d => {
            //         return naColor(d.value)
            //         // return 'none'
            //     })
            //     .attr("stroke", strokeColor)
            //     .attr("stroke-linejoin", "round")
            //     .merge(dnajoin)


            // compute the density data for south
            // 48°09'60.00" N -100°09'60.00" W
            // const southAmerica = data.filter(d => {
            //     return d.Longitude >= -100 &&
            //         d.Longitude <= -15 &&
            //         d.Latitude <= 20 &&
            //         d.Latitude >= -180
            // })
            //
            // console.log(southAmerica)
            //
            // var southAmericaDensity = d3.contourDensity()
            //     // .x(d => projection([d.Longitude, d.Latitude])[0])
            //     // .y(d => projection([d.Longitude, d.Latitude])[1])
            //     .x(d => d.Longitude)
            //     .y(d => d.Latitude)
            //     .size([width, height])
            //     .bandwidth(10)    // smaller = more precision in lines = more lines
            //     (southAmerica)
            //
            // console.log(southAmericaDensity)
            // const saColor = d3.scaleSequential(d3.extent(southAmericaDensity, d => d.value), d3.interpolateMagma)
            //
            //
            // const dsajoin = contoursg.selectAll('path.south-america')
            //     .data(southAmericaDensity)
            // dsajoin.enter()
            //     .append('path')
            //     .attr('class', d => `south-america ${d.value}`)
            //     .attr("d", geoPath)
            //     .attr('fill-opacity', 0.2)
            //     .attr("fill", d => {
            //         return saColor(d.value)
            //         // return 'none'
            //     })
            //     .attr("stroke", strokeColor)
            //     .attr("stroke-linejoin", "round")
            //     .merge(dsajoin)

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
