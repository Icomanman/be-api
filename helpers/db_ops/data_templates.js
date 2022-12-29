
const admin_users = {
    id: 1,
    company: "Illegal Logging LLC",
    company_id: 1,
    email: "waters@gmail.com",
    given_name: "Roger",
    family_name: "Waters",
    phone: "14445554321"
};

const business_owner = {
    name: "Tract Holdings LLC",
    contact_name: "Ginger Baker",
    email: "gbaker@tracts.com",
    phone: "17775554321",
    street: "Center St.",
    city: "Des Moines",
    state: "Iowa",
    zip: 50309
};

const company = {
    name: "Illegal Logging LLC",
    admin_users: [],
    mob_users: [],
    products: [
        {
            type: "Southern Red Oak",
            mill: "Sawmill Dusters LLC",
            distance: 32.6,
            rates: {
                delivered: 0.75,
                haul: 10.3,
                cut: 10,
                gross_stumpage: 13.5,
                commission: 1.5,
                net_stumpage: 13.25,
            },
        },
    ],
};

const company_users = {
    company: "Illegal Logging LLC",
    email: "waters@gmail.com",
    given_name: "Roger",
    family_name: "Waters",
    phone: "14445554321"
};

const consultant = {
    name: "Timber Consultants, Inc.",
    ein: 12345,
    contact_name: "Ginger Baker",
    email: "gbaker@tracts.com",
    phone: "17775554321",
    street: "Center St.",
    city: "Des Moines",
    state: "Iowa",
    zip: 50309
};

const individual_owner = {
    given_name: "Roger",
    family_name: "Waters",
    email: "waters@gmail.com",
    phone: "14445554321"
};

const invites = {
    company_id: 1,
    company: "Spruce Dev",
    given_name: "Roger",
    family_name: "Waters",
    email: "waters@gmail.com",
    phone: "14445554321",
    user_type: "admin"
};

const loads = {
    load_key: 1, // for mofiying existing loads
    tract_key: 1, // unique
    // unique combination of the ff:
    species_id: 4,
    product_id: 1,
    trucking_co: "Red Dragons LLC",
    driver: "Hoshino",
    open_date: "2022-06-09 23:06:44 +0000",
    closed_date: "2022-06-09 23:06:44 +0000",
    ticket_key: 1
};

const mobile_users = {
    id: 1,
    company_id: 1,
    company: "Illegal Logging LLC",
    given_name: "Roger",
    family_name: "Waters",
    email: "waters@gmail.com",
    phone: "14445554321"
};

const product = {
    name: 'Cedar',
    number: 101,
    company_id: 1,
    species_name: '',
    tract_key: 1,
    mill_location: "Oregon",
    dist_to_mill: 4,
    delivered_rate: 0.75,
    mileage_rate: 10.3,
    stump_rate: 13.5,
    commission: 1.3,
    cut_rate: 1
};

const report = {
    "title": "Tract Report",
    "company_id": 1,
    "tract_key": 1,
    "type": "Land Owner Settlement",
    "field_ids": [],
    "start_date": "2022-05-24 20:15:23 +0000",
    "end_date": "2022-05-24 20:15:23 +0000",
    "product_ids": [1, 2, 3],
    "mills": ["Georgian Mill", "Virginian Mill"],
    "with_image": false
};

const ticket = {
    "load_key": 1,
    "tract_key": 1,
    "date": "2022-06-09T23:06:44.000Z",
    "number": 21345913,
    "tonnage": 23.1,
    "file_name": "",
    "tag": "",
    "version": ""
};

const tract = {
    company_ids: [],
    name: "Aspen Oregon Tract",
    owner: {
        name: "Tract Holdings LLC.",
        contact: "Ginger Baker",
        email: "gbaker@tracts.com",
        phone: "17775554321",
        street: "Center St.",
        city: "Des Moines",
        state: "Iowa",
        zip: 50309,
    },
    owner_type: "business (or individual)",
    id: 3640012,
    start: "2022-04-29",
    state: "Oregon",
    county: "",
    open_loads: 12,
    total: 462,
    consultant: {
        name: "Timber Consultants, Inc.",
        contact: "Eric Clapton",
        email: "ec@timber.com",
        phone: "18887776543",
        street: "80th St.",
        city: "Virginia Beach",
        state: "Virginia",
        zip: 23451,
    },
    status: "draft, active or inactive",
};

const tract_default = {
    company_ids: [],
    name: "",
    owner_id: 1,
    owner_type: "", // business or individual
    owner: {},
    id: 000000,
    start: "",
    state: "",
    county: "",
    with_consultant: false,
    consultant_id: 1,
    consultant: {}
};

const tract_edit = {
    company_ids: [],
    name: "",
    owner_id: 1,
    owner_type: "", // business or individual
    owner: {},
    id: 000000,
    start: "",
    state: "",
    with_consultant: false,
    consultant_id: 1,
    consultant: {}
};

// *********************
// Common Timber Species
// *********************
const timber = [
    "Cedar",
    "Cypress",
    "Douglas Fir",
    "Eastern White Pine",
    "Southern Yellow Pine",
    "White Oak",
];
// *********************

module.exports = function (tmp = "tract") {
    const templates = {
        admin_users,
        business_owner,
        company,
        company_users,
        consultant,
        individual_owner,
        invites,
        loads,
        mobile_users,
        product,
        report,
        ticket,
        tract,
        tract_default,
        tract_edit,
        timber
    };
    return Object.assign({}, templates[tmp]);
};
