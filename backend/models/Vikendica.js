import mongoose from "mongoose"

const vikendicaSchema = new mongoose.Schema(
    {
        idVikendice: Number,
        naziv: String,
        mesto: String,
        telefon: String,
        cenaNocenjaLetnja: Number,
        cenaNocenjaZimska: Number,
        galerijaSlika: [String],
        zauzeta: Boolean,
        usluge: String,
        datumRezervacije: Date
    },
    {
        versionKey: false
    }
)

export default mongoose.model('Vikendica', vikendicaSchema, 'vikendice')