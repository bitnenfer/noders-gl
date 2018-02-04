class FileLoader
{
    constructor()
    {
        this.texts = {};
        this.images = {};

        this.textQueue = [];
        this.imageQueue = [];
    }

    getImage(key)
    {
        if (!this.images[key]) console.error('Couldn\'t find image', key);
        return this.images[key];
    }

    getText(key)
    {
        if (!this.texts[key]) console.error('Couldn\'t find text', key);
        return this.texts[key];
    }

    clear()
    {
        this.texts = {};
        this.images = {};
        return this;
    }

    process(callback)
    {
        const _this = this;
        const imageQueue = this.imageQueue;
        const textQueue = this.textQueue;
        const images = this.images;
        const texts = this.texts;
        const total = imageQueue.length + textQueue.length;
        let count = 0;

        for (let index = 0; index < imageQueue.length; ++index)
        {
            const elem = imageQueue[index];
            const img = new Image();

            img.onload = (function (_key, _img) {
                return function ()
                {
                    images[_key] = _img;
                    count += 1;
                    if (count >= total)
                    {
                        callback(_this);
                    }
                };
            }(elem.key, img));
            img.src = elem.path;
        }

        for (let index = 0; index < textQueue.length; ++index)
        {
            const elem = textQueue[index];
            const xhr = new XMLHttpRequest();

            xhr.responseType = 'text';
            xhr.onload = (function (_key, _xhr) {
                return function ()
                {
                    if (_xhr.status === 200 && _xhr.readyState === 4)
                    {
                        texts[_key] = _xhr.responseText;
                        count += 1;
                        if (count >= total)
                        {
                            callback(_this);
                        }
                    }
                };
            }(elem.key, xhr));
            xhr.open('GET', elem.path);
            xhr.send(null);
        }

        imageQueue.length = 0;
        textQueue.length = 0;

        return this;
    }

    addImage(key, path)
    {
        this.imageQueue.push({key: key, path: path});
        return this;
    }

    addText(key, path)
    {
        this.textQueue.push({key: key, path: path});
        return this;
    }
}