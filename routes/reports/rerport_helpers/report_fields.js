
// fields-to-db cols
const field_db_keys = {
    'Ticket #': 'number',
    'Truck': 'driver',
    'Tract Name': 'name',
    'Drop Off Site': 'mill_location',
    'Payload': 'name',
    'Quantity': 'tonnage',
    'UOM': '',
    'Delivered Price': 'delivered_rate',
    'Total Delivered Price': '',
    'Cut Rate': 'cut_rate',
    'Total Cut Rate': '',
    'Stumpage Rate': 'stump_rate',
    'Stumpage': '',
    'Trucking': 'trucking_co',
    'Total Trucking': ''
};

// fields-to-source tables
const fields = {
    "all": {
        'Ticket #': 'ticket',
        'Truck': 'load',
        'Tract Name': 'tract',
        'Drop Off Site': 'product',
        'Payload': 'product',
        'Quantity': 'load',
        'UOM': '',
        'Delivered Price': 'product',
        'Total Delivered Price': '',
        'Cut Rate': 'product',
        'Total Cut Rate': '',
        'Stumpage Rate': 'product',
        'Stumpage': '',
        'Trucking': 'load',
        'Total Trucking': ''
    },
    // default
    "land_owner": {
        'Ticket #': 'ticket',
        'Drop Off Site': 'product',
        'Payload': 'product',
        'Quantity': 'load',
        'Stumpage Rate': 'product'
    },
    "load": {

    },
    "trucker": {

    }
};

module.exports = function (type) {
    const field_keys = Object.assign({}, field_db_keys);
    const src_tables = Object.assign({}, fields[type]);
    const template_fields = Object.keys(fields[type]);
    return { field_keys, template_fields, src_tables };
};