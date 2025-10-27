const timeFormat = (minutes)=>{
    const hrs = Math.floor(minutes / 60);
    const minutesRemainder = minutes %60;
    return `${hrs}h ${minutesRemainder}m`
}

export default timeFormat;