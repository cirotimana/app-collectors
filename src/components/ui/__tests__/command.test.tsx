import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "../command"

describe("Command", () => {
    it("renders correctly and filters items", async () => {
        render(
            <Command>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                        <CommandItem>Calendar</CommandItem>
                        <CommandItem>Search Emoji</CommandItem>
                        <CommandItem>Calculator</CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        )

        expect(screen.getByPlaceholderText("Type a command or search...")).toBeInTheDocument()
        expect(screen.getByText("Suggestions")).toBeInTheDocument()
        expect(screen.getByText("Calendar")).toBeInTheDocument()

        // CMDK handles fitlering internally, we can test input
        const input = screen.getByPlaceholderText("Type a command or search...")
        fireEvent.change(input, { target: { value: "Cal" } })

        // We expect Calendar and Calculator to be visible (or at least in document)
        await waitFor(() => {
            expect(screen.getByText("Calendar")).toBeInTheDocument()
        })
    })

    it("handles selection", () => {
        const onSelect = jest.fn()
        render(
            <Command>
                <CommandList>
                    {/* CMDK requires value prop or text content */}
                    <CommandItem onSelect={() => onSelect("calendar")}>
                        Calendar
                    </CommandItem>
                </CommandList>
            </Command>
        )

        fireEvent.click(screen.getByText("Calendar"))
        expect(onSelect).toHaveBeenCalledWith("calendar")
    })

    it("renders CommandDialog correctly", () => {
  render(
    <CommandDialog open={true}>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandItem>Action</CommandItem>
      </CommandList>
    </CommandDialog>
  )

  // Verifica que el Dialog esté abierto y muestre el input
  expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument()
  // Verifica el título accesible del Dialog (sr-only)
  expect(screen.getByText("Command Palette")).toBeInTheDocument()
})

it("renders CommandDialog without close button", () => {
  const { container } = render(
    <CommandDialog open={true} showCloseButton={false}>
      <CommandInput />
    </CommandDialog>
  )
  // Dependiendo de tu DialogContent, podrías verificar que el botón X no exista
  expect(container.querySelector('button[className*="absolute"]')).not.toBeInTheDocument()
})

})
