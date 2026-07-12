import {Button, ColorInput, ColorPicker, Group, Stack, Text} from "@mantine/core";


function ColorField(
    {label, value, onChange, defaultValue, alpha=false}:
    {
        label: string,
        value: string,
        onChange: (value: string) => void,
        defaultValue?: string,
        alpha?: boolean,
    }) {
    return (<Stack gap={"sm"}>
        <Group justify={"space-between"}>
            <Text size={"sm"}>{label}</Text>
            {defaultValue && <Button size={"xs"} variant={"subtle"} color={"var(--color-fg-1)"} onClick={() => {onChange(defaultValue)}}>
                Reset to Default
            </Button>}
        </Group>

        <Stack gap={"xs"}>
            <ColorPicker format={alpha ? "hexa" : "hex"} value={value} onChange={onChange} fullWidth />
            <ColorInput format={alpha ? "hexa" : "hex"} value={value} onChange={onChange} withPicker={false} className={"w-full"}/>
        </Stack>
    </Stack>)
}


export default ColorField;