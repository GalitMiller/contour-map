import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'
import data from './data/data.json'
import WorldMap from './charts/heatMap'
import Toggle from './components/Toggle'


const margin = {top: 20, right: 30, bottom: 30, left: 40}

const MapContainer = () => {
    const d3Container = useRef(null)
    const [granularity, setGranularity] = useState(10);
    const [map, setMap] = useState('world')

    const handleGranularityChanged = useCallback(e => {
        setGranularity(20 - e.target.value >= 0 ? 20 - e.target.value : 0)
    }, [])

    const handleMapToggle = useCallback(e => {
        setMap(current => current === 'world' ? 'map' : 'world')
    }, [])

    useEffect(() => {
        const node = d3Container.current

        if (!data || !node) {
            console.log('goodbye')
            return
        }

        const width = 1300 - margin.left - margin.right
        const height = 800 - margin.top - margin.bottom

        d3.select(node)
            .data([data])
            .join('div')
            .attr('class', `container ${map}`)
            .call(WorldMap()
                .margin(margin)
                .width(width)
                .height(height)
                .map(map)
                .granularity(map === 'us' ? 10 : granularity))
            .exit().remove()
    }, [map, granularity]);

    return (
        <div>
            {/*controls*/}
            <div style={{display: 'flex'}}>
                <div style={{ margin: 10, color: 'white' }}>
                    <span style={{ padding: 15 }}>Granularity</span>
                    <input
                        type="range"
                        value={20 - granularity}
                        min="1"
                        max="20"
                        onChange={handleGranularityChanged} />
                </div>
                <div>
                    <Toggle on={map === 'world'} left="US" right="World" onToggle={handleMapToggle}/>
                </div>

            </div>

            {/*the map*/}
            <div ref={d3Container}></div>
        </div>
    );
};

export default MapContainer;