exports.handler = async (event, context, callback) => {
    const host = 'http://dev.spruceload.com:3000';
    const img_1 = '/images/image-1.png';
    const img_2 = '/images/image-2.png';

    if (event.triggerSource === 'CustomMessage_ForgotPassword') {
        event.response.emailSubject = `Spruce Forgot Password`;
        event.response.emailMessage = `<style type="text/css">
    @media only screen and (min-width: 520px) {
        .u-row {
            width: 500px !important;
        }

        .u-row .u-col {
            vertical-align: top;
        }

        .u-row .u-col-100 {
            width: 500px !important;
        }
    }

    @media (max-width: 520px) {
        .u-row-container {
            max-width: 100% !important;
            padding-left: 0px !important;
            padding-right: 0px !important;
        }

        .u-row .u-col {
            min-width: 320px !important;
            max-width: 100% !important;
            display: block !important;
        }

        .u-row {
            width: calc(100% - 40px) !important;
        }

        .u-col {
            width: 100% !important;
        }

        .u-col>div {
            margin: 0 auto;
        }
    }

    body {
        margin: 0;
        padding: 0;
    }

    table,
    tr,
    td {
        vertical-align: top;
        border-collapse: collapse;
    }

    p {
        margin: 0;
    }

    .ie-container table,
    .mso-container table {
        table-layout: fixed;
    }

    * {
        line-height: inherit;
    }

    a[x-apple-data-detectors="true"] {
        color: inherit !important;
        text-decoration: none !important;
    }

    table,
    td {
        color: #000000;
    }

    a {
        color: #0000ee;
        text-decoration: underline;
    }
</style>

<div class="clean-body u_body" style="
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      background-color: #fff;
      color: #000000;
    ">
    <table style="
        border-collapse: collapse;
        table-layout: fixed;
        border-spacing: 0;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        vertical-align: top;
        min-width: 320px;
        margin: 0 auto;
        background-color: #fff;
        width: 100%;
      " cellpadding="0" cellspacing="0">
        <tbody>
            <tr style="vertical-align: top">
                <td style="
              word-break: break-word;
              border-collapse: collapse !important;
              vertical-align: top;
            ">
                    <div class="u-row-container" style="padding: 0px; background-color: transparent">
                        <div class="u-row" style="
                  margin: 0 auto;
                  min-width: 320px;
                  max-width: 500px;
                  overflow-wrap: break-word;
                  word-wrap: break-word;
                  word-break: break-word;
                  background-color: transparent;
                ">
                            <div style="
                    border-collapse: collapse;
                    display: table;
                    width: 100%;
                    background-color: transparent;
                  ">
                                <div class="u-col u-col-100" style="
                      max-width: 320px;
                      min-width: 500px;
                      display: table-cell;
                      vertical-align: top;
                    ">
                                    <div style="width: 100% !important">
                                        <!--[if (!mso)&(!IE)]><!-->
                                        <div style="
                          padding: 0px;
                          border-top: 0px solid transparent;
                          border-left: 0px solid transparent;
                          border-right: 0px solid transparent;
                          border-bottom: 0px solid transparent;
                        ">
                                            <!--<![endif]-->
                                            <table style="
                            font-family: Roboto, arial, helvetica, san-serif;
                          " role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="
                                  overflow-wrap: break-word;
                                  word-break: break-word;
                                  padding: 10px;
                                  font-family: Roboto, arial, helvetica,
                                    san-serif;
                                " align="left">
                                                            <table width="100%" cellpadding="0" cellspacing="0"
                                                                border="0">
                                                                <tr>
                                                                    <td style="
                                        padding-right: 0px;
                                        padding-left: 0px;
                                      " align="left">
                                                                        <img align="left" border="0" src=${img_1} alt=""
                                                                            title="" style="
                                          outline: none;
                                          text-decoration: none;
                                          -ms-interpolation-mode: bicubic;
                                          clear: both;
                                          display: inline-block !important;
                                          border: none;
                                          height: auto;
                                          float: none;
                                          width: 100%;
                                          max-width: 50px;
                                        " width="50" />
                                                                        <img align="left" border="0" src=${img_2} alt=""
                                                                            title="" style="
                                          padding-left: 10px;
                                          outline: none;
                                          text-decoration: none;
                                          -ms-interpolation-mode: bicubic;
                                          clear: both;
                                          display: inline-block !important;
                                          border: none;
                                          height: auto;
                                          float: none;
                                          width: 100%;
                                          max-width: 170px;
                                        " height="100" />
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            <table style="
                            font-family: Roboto, arial, helvetica, san-serif;
                          " role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="
                                  overflow-wrap: break-word;
                                  word-break: break-word;
                                  padding: 10px;
                                  font-family: Roboto, arial, helvetica,
                                    san-serif;
                                " align="left">
                                                            <div style="
                                    line-height: 140%;
                                    text-align: left;
                                    word-wrap: break-word;
                                  ">
                                                                <p style="font-size: 14px; line-height: 140%">
                                                                    Hi ${event.request.clientMetadata.name}
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            <table style="
                            font-family: Roboto, arial, helvetica, san-serif;
                          " role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="
                                  overflow-wrap: break-word;
                                  word-break: break-word;
                                  padding: 10px;
                                  font-family: Roboto, arial, helvetica,
                                    san-serif;
                                " align="left">
                                                            <div style="
                                    line-height: 140%;
                                    text-align: left;
                                    word-wrap: break-word;
                                  ">
                                                                <p style="font-size: 14px; line-height: 140%">
                                                                    Need to reset your Spruce password? Click
                                                                    the button below:
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            <table style="
                            font-family: Roboto, arial, helvetica, san-serif;
                          " role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="
                                  overflow-wrap: break-word;
                                  word-break: break-word;
                                  padding: 10px;
                                  font-family: Roboto, arial, helvetica,
                                    san-serif;
                                " align="left">
                                                            <div align="center">
                                                                <a data-ref="${event.request.codeParameter}"
                                                                    href="${event.request.clientMetadata.link}"
                                                                    target="_blank" style="
                                      box-sizing: border-box;
                                      display: inline-block;
                                      font-family: Roboto, arial, helvetica,
                                        san-serif;
                                      text-decoration: none;
                                      -webkit-text-size-adjust: none;
                                      text-align: center;
                                      color: #ffffff;
                                      background-color: #0a164b;
                                      border-radius: 4px;
                                      -webkit-border-radius: 4px;
                                      -moz-border-radius: 4px;
                                      width: auto;
                                      max-width: 100%;
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      word-wrap: break-word;
                                      mso-border-alt: none;
                                    ">
                                                                    <span style="
                                        display: block;
                                        padding: 10px 20px;
                                        line-height: 120%;
                                      ">Reset Password</span>
                                                                </a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            <table style="
                            font-family: Roboto, arial, helvetica, san-serif;
                          " role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="
                                  overflow-wrap: break-word;
                                  word-break: break-word;
                                  padding: 10px;
                                  font-family: Roboto, arial, helvetica,
                                    san-serif;
                                " align="left">
                                                            <div style="
                                    line-height: 140%;
                                    text-align: left;
                                    word-wrap: break-word;
                                  ">
                                                                <p style="font-size: 14px; line-height: 140%">
                                                                    If you feel you received this email by
                                                                    mistake, feel free to ignore it.
                                                                    (${event.request.codeParameter})
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            <table style="
                            font-family: Roboto, arial, helvetica, san-serif;
                          " role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                <tbody>
                                                    <tr>
                                                        <td style="
                                  overflow-wrap: break-word;
                                  word-break: break-word;
                                  padding: 10px;
                                  font-family: Roboto, arial, helvetica,
                                    san-serif;
                                " align="left">
                                                            <div style="
                                    line-height: 140%;
                                    text-align: left;
                                    word-wrap: break-word;
                                  ">
                                                                <p style="font-size: 14px; line-height: 140%">
                                                                    Thanks,
                                                                </p>
                                                                <p style="font-size: 14px; line-height: 140%">
                                                                    The Spruce Team
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
</div>
`;
    }
    else if (event.triggerSource === 'CustomMessage_AdminCreateUser') {
        event.response.emailSubject = `Spruce Invitation`;
        event.response.emailMessage = `<style>
  @media only screen and (min-width: 520px) {
    .u-row {
      width: 500px !important;
    }

    .u-row .u-col {
      vertical-align: top;
    }

    .u-row .u-col-100 {
      width: 500px !important;
    }
  }

  @media (max-width: 520px) {
    .u-row-container {
      max-width: 100% !important;
      padding-left: 0px !important;
      padding-right: 0px !important;
    }

    .u-row .u-col {
      min-width: 320px !important;
      max-width: 100% !important;
      display: block !important;
    }

    .u-row {
      width: calc(100% - 40px) !important;
    }

    .u-col {
      width: 100% !important;
    }

    .u-col>div {
      margin: 0 auto;
    }
  }

  body {
    margin: 0;
    padding: 0;
  }

  table,
  tr,
  td {
    vertical-align: top;
    border-collapse: collapse;
  }

  p {
    margin: 0;
  }

  .ie-container table,
  .mso-container table {
    table-layout: fixed;
  }

  * {
    line-height: inherit;
  }

  a[x-apple-data-detectors="true"] {
    color: inherit !important;
    text-decoration: none !important;
  }

  table,
  td {
    color: #000000;
  }

  a {
    color: #0000ee;
    text-decoration: underline;
  }
</style>

<body class="clean-body u_body" style="
    margin: 0;
    padding: 0;
    -webkit-text-size-adjust: 100%;
    background-color: #fff;
    color: #000000;
  ">
  <table style="
      border-collapse: collapse;
      table-layout: fixed;
      border-spacing: 0;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      vertical-align: top;
      min-width: 320px;
      margin: 0 auto;
      background-color: #fff;
      width: 100%;
    " cellpadding="0" cellspacing="0">
    <tbody>
      <tr style="vertical-align: top">
        <td style="
            word-break: break-word;
            border-collapse: collapse !important;
            vertical-align: top;
          ">
          <div class="u-row-container" style="padding: 0px; background-color: transparent">
            <div class="u-row" style="
                margin: 0 auto;
                min-width: 320px;
                max-width: 500px;
                overflow-wrap: break-word;
                word-wrap: break-word;
                word-break: break-word;
                background-color: transparent;
              ">
              <div style="
                  border-collapse: collapse;
                  display: table;
                  width: 100%;
                  background-color: transparent;
                ">
                <div class="u-col u-col-100" style="
                    max-width: 320px;
                    min-width: 500px;
                    display: table-cell;
                    vertical-align: top;
                  ">
                  <div style="width: 100% !important">
                    <div style="
                        padding: 0px;
                        border-top: 0px solid transparent;
                        border-left: 0px solid transparent;
                        border-right: 0px solid transparent;
                        border-bottom: 0px solid transparent;
                      ">
                      <table style="font-family: Roboto, arial, helvetica, san-serif" role="presentation"
                        cellpadding="0" cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td style="
                                overflow-wrap: break-word;
                                word-break: break-word;
                                padding: 10px;
                                font-family: Roboto, arial, helvetica, san-serif;
                              " align="left">
                              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td style="
                                      padding-right: 0px;
                                      padding-left: 0px;
                                    " align="left">
                                    <img align="left" border="0" src="images/image-1.png" alt="" title="" style="
                                        outline: none;
                                        text-decoration: none;
                                        -ms-interpolation-mode: bicubic;
                                        clear: both;
                                        display: inline-block !important;
                                        border: none;
                                        height: auto;
                                        float: none;
                                        width: 100%;
                                        max-width: 50px;
                                      " width="50" />
                                    <img align="left" border="0" src="images/image-2.png" alt="" title="" style="
                                        padding-left: 10px;
                                        outline: none;
                                        text-decoration: none;
                                        -ms-interpolation-mode: bicubic;
                                        clear: both;
                                        display: inline-block !important;
                                        border: none;
                                        height: auto;
                                        float: none;
                                        width: 100%;
                                        max-width: 170px;
                                      " height="100" />
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <table style="font-family: Roboto, arial, helvetica, san-serif" role="presentation"
                        cellpadding="0" cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td style="
                                overflow-wrap: break-word;
                                word-break: break-word;
                                padding: 10px;
                                font-family: Roboto, arial, helvetica, san-serif;
                              " align="left">
                              <div style="
                                  line-height: 140%;
                                  text-align: left;
                                  word-wrap: break-word;
                                ">
                                <p style="font-size: 14px; line-height: 140%">
                                  Hi ${event.request.clientMetadata.invite_name} (${event.request.usernameParameter}
                                </p>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <table style="font-family: Roboto, arial, helvetica, san-serif" role="presentation"
                        cellpadding="0" cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td style="
                                overflow-wrap: break-word;
                                word-break: break-word;
                                padding: 10px;
                                font-family: Roboto, arial, helvetica, san-serif;
                              " align="left">
                              <div style="
                                  line-height: 140%;
                                  text-align: left;
                                  word-wrap: break-word;
                                ">
                                <p style="font-size: 14px; line-height: 140%">
                                  ${event.request.clientMetadata.admin_name} has invited you to join
                                  <span style="
                                      font-weight: 600;
                                      font-size: 16px;
                                      color: #0a164b;
                                    ">Spruce</span>
                                </p>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <table style="font-family: Roboto, arial, helvetica, san-serif" role="presentation"
                        cellpadding="0" cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td style="
                                overflow-wrap: break-word;
                                word-break: break-word;
                                padding: 10px;
                                font-family: Roboto, arial, helvetica, san-serif;
                              " align="left">
                              <div align="center">
                                <a data-ref=" ${event.request.codeParameter}"
                                  href="${event.request.clientMetadata.link}" target="_blank" style="box-sizing: border-box; display:
                                  inline-block; font-family: Roboto, arial, helvetica, san-serif; text-decoration: none;
                                  -webkit-text-size-adjust: none; text-align: center; color: #ffffff; background-color:
                                  #0a164b; border-radius: 4px; -webkit-border-radius: 4px; -moz-border-radius: 4px;
                                  width: auto; max-width: 100%; overflow-wrap: break-word; word-break: break-word;
                                  word-wrap: break-word; mso-border-alt: none; ">
                                  <span style=" display: block; padding: 10px 20px; line-height: 120%; ">
                                    Accept Invite</span>
                                </a>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <table style=" font-family: Roboto, arial, helvetica, san-serif" role="presentation"
                        cellpadding="0" cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td style="
                                overflow-wrap: break-word;
                                word-break: break-word;
                                padding: 10px;
                                font-family: Roboto, arial, helvetica, san-serif;
                              " align="left">
                              <div style="
                                  line-height: 140%;
                                  text-align: left;
                                  word-wrap: break-word;
                                ">
                                <p style="font-size: 14px; line-height: 140%">
                                  Thanks,
                                </p>
                                <p style="font-size: 14px; line-height: 140%">
                                  The Spruce Team
                                </p>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</body>`
    }
    // return to Cognito
    callback(null, event);
};
