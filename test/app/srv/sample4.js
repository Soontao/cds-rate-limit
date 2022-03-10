const cds = require("@sap/cds")


module.exports = class Sample4Service extends cds.ApplicationService {


  async init() {
    this.on("getName", async (req) => {
      const { PeopleID } = req.data;
      const person = await this.run(SELECT.one("People", PeopleID))
      return person?.Name;
    })

    this.on("getName", "People", async (req) => {
      const [PeopleID] = req.params;
      const person = await this.run(SELECT.one("People", PeopleID))
      return person?.Name;
    })

    await super.init()
  }

}

