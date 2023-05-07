import React from 'react'

const Toggle = ({ on, onToggle, left, right }) => {
    return (
        <div style={{display: 'flex', paddingTop: 10, paddingLeft: 25 }}>
            <span className="react-switch-left"> {left} </span>
            <input
                checked={on}
                onChange={onToggle}
                className="react-switch-checkbox"
                id={`react-switch-new`}
                type="checkbox"
            />
            <label
                className="react-switch-label"
                htmlFor={`react-switch-new`}>
                <span className={`react-switch-button`} />
            </label>
            <span className="react-switch-right">{right}</span>
        </div>
    )
}

export default Toggle