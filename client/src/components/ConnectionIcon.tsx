


function ConnectionIcon({connected, mb=0, mt=0}: {connected: boolean, mb?: number, mt?: number}) {


    return (<div className={`w-3 h-3 rounded-full transition-colors duration-500
    ${connected ? "bg-green-500/80" : "bg-green-500/5 border-2 border-gray-300/50"}`}
    style={{
        marginTop: mt,
        marginBottom: mb,
    }}
    >

    </div>)
}



export default ConnectionIcon;