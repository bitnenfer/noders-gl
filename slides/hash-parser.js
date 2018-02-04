function ParseHash(str)
{
    const split = str.split('&');
    const output = {};

    split[0] = split[0].replace('#', '');

    for (let index = 0; index < split.length && split[0].length > 0; ++index)
    {
        const s = split[index].split('=');
        output[s[0]] = parseInt(s[1]);
    }
    
    return output;
}