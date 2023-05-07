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

            var projection = d3.geoEqualEarth()
            // var projection = d3.geoEquirectangular()
            // var projection = d3.geoOrthographic()
            // var projection = d3.geoAzimuthalEqualArea()
            // var projection = d3.geoGnomonic()
            // var projection = d3.geoConicEqualArea()
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

            // plot the groups
            let groupsg = theMap.selectAll('.groups').data(['once']);
            groupsg = groupsg.enter()
                .append('g').attr('class', 'groups')
                .merge(groupsg)

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

            const defs = filter.enter().append('defs').merge(filter)

            let glow = defs.append('filter')
                .attr('id', 'glow');
            glow.append('feGaussianBlur')
                .attr('stdDeviation', '7')
                .attr('result', 'coloredBlur');
            const feMerge = glow.append('feMerge');
            feMerge.append('feMergeNode').attr('in', 'coloredBlur');
            feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

            let glow2 = defs.append('filter')
                .attr('id', 'bigglow');
            glow2.append('feGaussianBlur')
                .attr('stdDeviation', '7')
                .attr('result', 'coloredBlur');
            const bigglowMerge = glow2.append('feMerge');
            bigglowMerge.append('feMergeNode').attr('in', 'coloredBlur');
            bigglowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

            // add features
            const fjoin = mapg.selectAll('.feature')
                .data([world, graticule], d => d.type)
            fjoin.enter()
                .append('path').attr('class', d => `feature ${d.type} ${d.name}`)
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

            console.log(graticule)
            console.log(data)

            const nearestLat = v => Math.ceil(v / 5) * 5
            const nearestLon = v => Math.ceil(v / 10) * 10

            // create the data grid
            const lats = d3.range(-90, 95, 5)
            const lons = d3.range(-180, 190, 10)
            // console.log('grid', lat, lon)
            const grid = lats.reduce((a, lat) => {
                const row = lons.map(lon => ({ lat, lon, count: 0, avg: 0 }))
                const r = row.reduce((ra, c) => {
                    return { ...ra, [`${c.lat} ${c.lon}`]: c}
                }, {})
               return { ...a, ...r }
            }, {})

            console.log('grid', grid)

            // group data by graticule
            const groups = data.reduce((a, c) => {
                const rlat = nearestLat(c.Latitude)
                const rlon = nearestLon(c.Longitude)
                const key = `${rlat} ${rlon}`
                let e = a[key]
                if (!e) {
                    console.log('key not found', key)
                    return a
                }
                e.avg = e.avg * e.count/(e.count+1) + c.LimitingMag/(e.count+1)
                e.count += 1
                return { ...a, [key]: e}
            }, grid)

            const daGroups = Object.values(groups).filter(g => g.avg > 0)

            // add/update groups
            const gjoin = groupsg.selectAll('.group')
                .data(daGroups, (d, i) => i)
            gjoin.exit().remove()

            gjoin.enter()
                .append('circle')
                .attr('class', 'group')
                .attr('r', 14)
                .attr('cx', d => projection([d.lon, d.lat])[0])
                .attr('cy', d => projection([d.lon, d.lat])[1])
                .attr('fill', d => color(d.avg))
                .attr('fill-opacity', 0.5)
                .style("filter", "url(#bigglow)")
                .merge(gjoin)
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
