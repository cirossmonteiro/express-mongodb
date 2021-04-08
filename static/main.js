const deleteDocument = (endpoint, id) => {
    console.log('hello, ciro: ', endpoint, id);
    $.ajax({
        method: 'DELETE',
        url: `/${endpoint}/${id}`
    })
}

const updateField = (endpoint, model, id, path) => {
    const input = $(`input[model='${model}'][name='${path}']`).first();
    const inputType = input.attr('type'), value = input.val();
    let newValue;
    if (inputType === 'checkbox') {
        newValue = input.is(":checked");
    } else {
        newValue = value;
    }
    $.ajax({
        method: 'PATCH',
        url: `/${endpoint}/${id}`,
        data: {
            [path]: newValue
        }
    });
}