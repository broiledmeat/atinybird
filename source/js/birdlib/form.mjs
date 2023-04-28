import {PALETTES} from "/js/birdlib/color.mjs";

let _elementCount = 0;

/**
 * @param {Element} container
 * @param {String} label
 * @param {CallableFunction} getter
 * @param {CallableFunction} setter
 * @param {Number} min
 * @param {Number} max
 */
export const appendRangeInput = (container, label, getter, setter, min = 0, max = 100) =>
{
    _elementCount++;
    const id = `input${_elementCount}`;

    const labelElement = document.createElement("label");
    labelElement.htmlFor = id;
    labelElement.innerText = label;

    const valueElement = document.createElement("span");
    valueElement.innerText = (getter() | 0).toString();

    const inputElement = document.createElement("input");
    inputElement.id = id;
    inputElement.type = "range";
    inputElement.min = min;
    inputElement.max = max;
    inputElement.value = getter();
    inputElement.oninput = () =>
    {
        setter(inputElement.value);
        valueElement.innerText = (getter() | 0).toString();
    };

    container.appendChild(labelElement);
    container.appendChild(inputElement);
    container.appendChild(valueElement);
    container.appendChild(document.createElement("br"));
}

/**
 * @param {Element} container
 * @param {String} label
 * @param {CallableFunction} handler
 */
export const appendPaletteInput = (container, label, handler) =>
{
    _elementCount++;
    const id = `input${_elementCount}`;

    const labelElement = document.createElement("label");
    labelElement.htmlFor = id;
    labelElement.innerText = label;

    const inputElement = document.createElement("select")
    inputElement.id = id;

    for (const name of Object.keys(PALETTES))
    {
        inputElement.innerHTML += `<option value="${name}">${name}</option>`;
    }

    inputElement.onchange = function()
    {
        handler(PALETTES[inputElement.value]);
    };

    container.appendChild(labelElement);
    container.appendChild(inputElement);
    container.appendChild(document.createElement("br"));
}

/**
 * @param {Element} container
 * @param {String} label
 * @param {CallableFunction} handler
 */
export const appendButtonInput = (container, label, handler) =>
{
    const buttonElement = document.createElement("button");
    buttonElement.innerText = label;
    buttonElement.onclick = () =>
    {
        handler();
        return false;
    }

    container.appendChild(buttonElement);
    container.appendChild(document.createElement("br"));
}