import styled from "styled-components"

const Underlining = styled.span`
  box-shadow: inset 0 ${({ big }) => (big ? "-.75rem" : "-.5rem")} 0
    ${({ theme, highlight }) =>
      highlight ? theme.colors.secondary : theme.colors.secondary};
  transition: box-shadow 0.3s ease-out;
  &:hover {
    color: ${({ theme, big }) =>
      big ? theme.colors.primary : theme.colors.background};
    box-shadow: inset 0 ${({ big }) => (big ? "-2rem" : "-1.5rem")} 0
      ${({ theme }) => theme.colors.tertiary};
  }
`

export default Underlining
