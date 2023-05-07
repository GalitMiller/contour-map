// pick the data grid based on granularity
import data from "./data.json"
import * as d3 from "d3"

// const XHIGH = 2
const HIGH = 5
const MED = 10
const LOW = 15

// const lats_xhigh = d3.range(-90, 90 + XHIGH, XHIGH)
// const lons_xhigh = d3.range(-180, 180 + XHIGH, XHIGH)

const lats_high = d3.range(-90, 90 + HIGH, HIGH)
const lons_high = d3.range(-180, 180 + HIGH, HIGH)

const lats_med = d3.range(-90, 90 + MED, MED)
const lons_med = d3.range(-180, 180 + MED, MED)

const lats_low = d3.range(-90, 90 + LOW, LOW)
const lons_low = d3.range(-180, 180 + LOW, LOW)

// const nearestXHigh = v => Math.floor(v / XHIGH) * XHIGH
const nearestHigh = v => Math.floor(v / HIGH) * HIGH
const nearestMed = v => Math.floor(v / MED) * MED
const nearestLow = v => Math.floor(v / LOW) * LOW

// const GridXHigh = lats_xhigh.reduce((a, lat) => {
//     const r = {}
//     lons_xhigh.forEach(lon => {
//         r[`${lat} ${lon}`] = { lat, lon, count: 0, avg: 0, key: `${lat} ${lon}` }
//     })
//     return { ...a, ...r }
// }, {})

const GridHigh = lats_high.reduce((a, lat) => {
    const r = {}
    lons_high.forEach(lon => {
        r[`${lat} ${lon}`] = { lat, lon, count: 0, avg: 0, key: `${lat} ${lon}` }
    })
    return { ...a, ...r }
}, {})

const GridMed = lats_med.reduce((a, lat) => {
    const r = {}
    lons_med.forEach(lon => {
        r[`${lat} ${lon}`] = { lat, lon, count: 0, avg: 0, key: `${lat} ${lon}` }
    })
    return { ...a, ...r }
}, {})

const GridLow = lats_low.reduce((a, lat) => {
    const r = {}
    lons_low.forEach(lon => {
        r[`${lat} ${lon}`] = { lat, lon, count: 0, avg: 0, key: `${lat} ${lon}` }
    })
    return { ...a, ...r }
}, {})

// group data by grid
// const GroupsXHigh = data.reduce((a, c) => {
//     const rlat = nearestXHigh(c.Latitude)
//     const rlon = nearestXHigh(c.Longitude)
//     const key = `${rlat} ${rlon}`
//     let e = a[key]
//     if (!e) {
//         console.log('key not found', key)
//         return a
//     }
//     e.avg = e.avg * e.count/(e.count+1) + c.LimitingMag/(e.count+1)
//     e.count += 1
//     return { ...a, [key]: e}
// }, GridXHigh)

const GroupsHigh = data.reduce((a, c) => {
    const rlat = nearestHigh(c.Latitude)
    const rlon = nearestHigh(c.Longitude)
    const key = `${rlat} ${rlon}`
    let e = a[key]
    if (!e) {
        console.log('key not found', key)
        return a
    }
    e.avg = e.avg * e.count/(e.count+1) + c.LimitingMag/(e.count+1)
    e.count += 1
    return { ...a, [key]: e}
}, GridHigh)

const GroupsMed = data.reduce((a, c) => {
    const rlat = nearestMed(c.Latitude)
    const rlon = nearestMed(c.Longitude)
    const key = `${rlat} ${rlon}`
    let e = a[key]
    if (!e) {
        console.log('key not found', key)
        return a
    }
    e.avg = e.avg * e.count/(e.count+1) + c.LimitingMag/(e.count+1)
    e.count += 1
    return { ...a, [key]: e}
}, GridMed)

const GroupsLow = data.reduce((a, c) => {
    const rlat = nearestLow(c.Latitude)
    const rlon = nearestLow(c.Longitude)
    const key = `${rlat} ${rlon}`
    let e = a[key]
    if (!e) {
        console.log('key not found', key)
        return a
    }
    e.avg = e.avg * e.count/(e.count+1) + c.LimitingMag/(e.count+1)
    e.count += 1
    return { ...a, [key]: e}
}, GridLow)

const ScaleGranularity = granularity => granularity > 10 ? LOW : granularity > 5 ? MED : HIGH // granularity > 2 ? HIGH : XHIGH

export {
    // GroupsXHigh,
    GroupsHigh,
    GroupsMed,
    GroupsLow,
    ScaleGranularity,
}