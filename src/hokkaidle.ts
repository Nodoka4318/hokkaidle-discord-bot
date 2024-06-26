import { ActionRowBuilder, AttachmentBuilder, Colors, ComponentType, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { Region } from "./region";
import { SubprefectureMap } from "./subprefectureMap";

const path = require("node:path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("hokkaidle")
        .setDescription("Hokkaidleゲームを開始します。"),
    async execute(interaction: object) {
        game(interaction)
    }
};

const regionJSON = require("../resources/regions.json");
const regions: Region[] = regionJSON.map((item: any) => {
    return new Region(item.name, item.subprefecture, item.code, item.latitude, item.longitude);
});
const imagesPath = "../resources/images/"

// regionsをsubprefectureごとに分ける
let spMaps: SubprefectureMap[] = [];

for (let r of regions) {
    let map = spMaps.find(m => m.name == r.subprefecture)

    if (!map) {
        let newMap = new SubprefectureMap();
        newMap.name = r.subprefecture;
        newMap.regions = []

        spMaps.push(newMap);
        map = newMap
    }

    map.regions.push(r);
}

async function game(interaction: any) {
    const randomIndex = Math.floor(Math.random() * regions.length);
    const randomRegion = regions[randomIndex];
    const imageUrl = path.join(__dirname, `${imagesPath}/${randomRegion.code}.png`);

    console.log(randomRegion);
    
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Hokkaidle')
        .setDescription('ここはどこでしょう？')
        .setImage("attachment://region.png");

    const attachment = new AttachmentBuilder(imageUrl).setName("region.png");

    await interaction.reply({
        embeds: [embed],
        files: [attachment]
    });

    let regionSelects: StringSelectMenuBuilder[] = [];

    for (let m of spMaps) {
        let options: StringSelectMenuOptionBuilder[] = []

        for (let r of m.regions) {
            options.push(
                new StringSelectMenuOptionBuilder()
                    .setLabel(r.name)
                    .setValue(r.code + "")
            );
        }

        regionSelects.push(
            new StringSelectMenuBuilder()
                .setCustomId(m.name)
                .setPlaceholder(`${m.name}から選択`)
                .addOptions(options)
        );
    }

    let subprefectureOptions: StringSelectMenuOptionBuilder[] = [];

    for (let m of spMaps) {
        subprefectureOptions.push(
            new StringSelectMenuOptionBuilder()
                .setLabel(m.name)
                .setValue(m.name)
        );
    }

    let selectedTowns: string[] = [];
    let boxesList: string[][] = [];
    let i = 0;

    const loop = async () => {
        let subprefectureSelect = new StringSelectMenuBuilder()
            .setCustomId("subprefecture")
            .setPlaceholder(`振興局を選択`)
            .addOptions(subprefectureOptions);

        const subprefectureResponse = await interaction.followUp({
            components: [new ActionRowBuilder().addComponents(subprefectureSelect)]
        });

        const subprefectureCollector = subprefectureResponse.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 600000 });

        let currentRegionResponse: any;

        subprefectureCollector.on('collect', async (si: any) => {
            const selection = si.values[0];

            if (currentRegionResponse) {
                currentRegionResponse.delete();
            }

            si.deferUpdate();

            let regionSelect = regionSelects.find(s => s.data.custom_id == selection);
            const regionResponse = await interaction.followUp({
                components: [new ActionRowBuilder().addComponents(regionSelect!)]
            });

            currentRegionResponse = regionResponse;

            const regionCollector = regionResponse.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 600000 });

            // TODO: このネスト汚いな
            regionCollector.on('collect', async (j: any) => {
                const regionSelection = j.values[0];
                const selected = regions.find(r => r.code == regionSelection);

                let percent = randomRegion.calcPercent(selected!);
                let boxes = Region.getSquareCharacters(percent);

                selectedTowns.push(`${selected?.subprefecture} ${selected?.name}`);
                boxesList.push(boxes);

                j.deferUpdate();

                if (regionSelection == randomRegion.code) {
                    const finEmbed = new EmbedBuilder()
                        .setColor(Colors.Blurple)
                        .setTitle('Hokkaidle')
                        .setDescription(`${i + 1}/5\n${boxesList.map(l => l.join("")).join("\n")}`)
                        .setThumbnail("attachment://region.png")
                        .addFields(
                            { name: "あなたの選択", value: `||${selectedTowns.join(" → ")}||` }
                        );

                    await interaction.followUp({
                        embeds: [finEmbed],
                        files: [attachment]
                    });

                    currentRegionResponse.delete();
                    subprefectureResponse.delete();

                    return;
                } else {
                    let selectedTown = `${selected?.subprefecture} ${selected?.name}`;
                    let bearing = randomRegion.getDirectionArrow(selected!)
                    let distance = randomRegion.calcDistance(selected!).toFixed(1);

                    const guessEmbed = new EmbedBuilder()
                        .setColor(Colors.LuminousVividPink)
                        .setTitle("Hokkaidle")
                        .setDescription(`${percent}%\n${boxes.join("")}`)
                        .addFields(
                            { name: "選んだ地域", value: `||${selectedTown}||`}, 
                            { name: "方角", value: `${bearing}`, inline: true },
                            { name: "距離", value: `${distance}km`, inline: true }
                        );
                    
                    await interaction.followUp({
                        embeds: [guessEmbed]
                    });

                    currentRegionResponse.delete();
                    subprefectureResponse.delete();
                }

                if (i >= 4) {
                    const finEmbed = new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setTitle('Hokkaidle')
                        .setDescription(`*/5\n${boxesList.map(l => l.join("")).join("\n")}`)
                        .setThumbnail("attachment://region.png")
                        .addFields(
                            { name: "答え", value: `||${randomRegion.subprefecture} ${randomRegion.name}||` },
                            { name: "あなたの選択", value: `||${selectedTowns.join(" → ")}||` },
                        );

                    interaction.followUp({
                        embeds: [finEmbed],
                        files: [attachment]
                    });

                    return;
                }

                i++;
                loop();
            });
        });
    }

    await loop();
}