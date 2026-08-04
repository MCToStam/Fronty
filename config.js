class config {
  constructor() {
    this.colors = {
      error: 0xff0000,
      success: 0x3fff00,
      warn: 0xffa500,
      normal: 0x480ca8,
    };
    this.log_channels = {
      error: "1534250945750499498",
      command: "1534250367473422379",
      button: "1534250367473422379",
      selectMenu: "1534250367473422379",
      modal: "1534250367473422379",
      invitationBot: "1534250307641413882",
    };
  }
}

module.exports = new config();
