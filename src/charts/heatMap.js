import * as d3 from 'd3'
import * as topojson from 'topojson-client'

import countriesJson from '../data/ne_110m_countries.json'
import placesJson from '../data/ne_110m_places.json'
import usJson from "../data/states-10m.json"

import {GroupsXHigh, GroupsHigh, GroupsMed, GroupsLow, ScaleGranularity, StrGranularity} from '../data/groups'

const world = topojson.feature(countriesJson, countriesJson.objects.countries)
const us = topojson.feature(usJson, usJson.objects.states)
const graticule = d3.geoGraticule()()

const countryLabels = topojson.feature(countriesJson, countriesJson.objects.countries)
const placesLabels = topojson.feature(placesJson, placesJson.objects.places)

const DensityChart = function () {
    let width = 460;
    let height = 400;
    let margin = {top: 20, right: 30, bottom: 30, left: 40};
    let granularity = 10;
    let map = '';

    function my (selection) {
        if (!selection) return;
        selection.each(function (data, i) {
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

            var projection = map === 'world' ? d3.geoEqualEarth() : d3.geoAlbersUsa()
            // var projection = d3.geoEquirectangular()
            // var projection = d3.geoOrthographic()
            // var projection = d3.geoAzimuthalEqualArea()
            // var projection = d3.geoGnomonic()
            // var projection = d3.geoConicEqualArea()
            projection.fitSize([width, height], map === 'world' ? world : us)

            data = data.filter(d => projection([d.Longitude, d.Latitude]))

            var geoPath = d3.geoPath().projection(projection)

            let theMap = top.selectAll('.geomap').data(['once']);
            theMap = theMap.enter()
                .append('g')
                .attr('class', 'geomap')
                .merge(theMap)

            // add legend
            let legendd = theMap.selectAll('.legends').data(['once']);

            // granularity level
            // let legendt = legendd.enter()
            //     .append('text')
            //     .attr('class', 'granularity')
            // legendt.merge(legendt)
            //     .text(StrGranularity(granularity))

            legendd = legendd.enter()
                .append('g').attr('class', 'legends')
                .merge(legendd)

            legendd.selectAll('text.granularity')
                .text(StrGranularity(granularity))

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

            const color = d3.scaleSequential([0, 7], d3.interpolateMagma)

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
            const features = map === 'world' ? [world, graticule] : [us]
            const fjoin = mapg.selectAll('.feature')
                .data(features, d => d.type)
            fjoin.enter()
                .append('path').attr('class', d => `feature ${d.type} ${d.name}`)
                .merge(fjoin)
                .attr('d', geoPath)

            fjoin.exit().remove()

            // add labels
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

            clabelsjoin.exit().remove()

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

            plabelsjoin.exit().remove()

            // pick the pre-calculated data groups based on granularity
            let groups = GroupsMed
            if (granularity > 10) {
                groups = GroupsLow
            } else if (granularity <= 5) {
                groups = GroupsHigh
            }

            const _granularity = ScaleGranularity(granularity)

            const groupFeatures = Object.values(groups)
                .filter(g => g.avg > 0)
                .map(d => ({
                type: 'Feature',
                geometry: {
                    type: "Polygon",
                    coordinates: [
                        [
                            [d.lon, d.lat],
                            [d.lon, d.lat + _granularity],
                            [d.lon + _granularity, d.lat + _granularity],
                            [d.lon + _granularity, d.lat],
                            [d.lon, d.lat],
                        ],
                    ],
                },
                id: d.key,
                properties: { value: d.avg }
            }), [])

            // add/update groups
            const gjoin = groupsg.selectAll('.group')
                .data(groupFeatures, d => d.id)
            gjoin.exit().remove()

            gjoin.enter()
                .append("path")
                .merge(gjoin)
                .attr("class", "group")
                .attr('d', geoPath)
                .attr('fill', d => color(d.properties.value))

            // legend
            const legend = d3.range(0, 8).map(d => color(d))
            const gleg = legendd.selectAll('.legend')
                .data(legend, d => d)

            gleg.exit().remove()

            gleg.enter()
                .append("rect")
                .attr("class", "legend")
                .attr('x', (d, i) => 55 * i)
                .attr('y', height - 10)
                .attr('width', 20)
                .attr('height', 20)
                .attr('fill', d => d)

            gleg.enter()
                .append("text")
                .attr("class", "legend-text")
                .attr('x', (d, i) => 55 * i - 5)
                .attr('y', height + 30)
                .text((d, i) => `${i} - ${i + 1}`)
                .attr('fill', 'white')

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

    my.granularity = function(v) {
        granularity = v;
        return my;
    }

    my.map = function(v) {
        map = v;
        return my;
    }

    return my;
};

export default DensityChart;
