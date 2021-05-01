import React from "react"
import styled from "styled-components"
import { MDXRenderer } from "gatsby-plugin-mdx"

const StyledModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;  
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  font-size: .85rem;
  h1, h2, h3 {
      margin: 0;
  }
  h2 {
      margin-top: 1.5rem;
      font-size: 1.5rem;
      line-height: 2.5rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.tertiary};
      
  }
  h3 {
      font-size: 1rem;
  }
  ul,
  li {
    margin: 0;
    padding: 0;
  }
  hr {
      margin: 0.5rem auto
  }
  strong {
    color: ${({ theme }) => theme.colors.tertiary};
  }


//   @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//     width: 23.25rem;
//     background: ${({ theme }) => theme.colors.background};
//     a {
//       color: ${({ theme }) => theme.colors.primary};
//     }
//   }
  .nav-link {
    font-size: 1rem;
    font-weight: 700;
    text-align: center;
    position: relative;
    margin: 0 0 0 1.25rem;
    padding: 0;
    &::before {
      transition: 200ms ease-out;
      height: 0.1563rem;
      content: "";
      position: absolute;
      background-color: ${({ theme }) => theme.colors.primary};
      width: 0%;
      bottom: -0.125rem;
    }
    &:hover::before {
      width: 100%;
    }
  }
  .lang {
    margin: 0;
  }
  .cta-btn {
    width: auto;
    height: auto;
    font-weight: 700;
    border-radius: ${({ theme }) => theme.borderRadius};
    border: 0.125rem solid ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.background};
    transition: 20ms ease-out;
    font-size: 1rem;
    padding: 0.5rem 1.5rem;
    margin: 0;
    &:hover {
      background: ${({ theme }) => theme.colors.tertiary};
      color: ${({ theme }) => theme.colors.background};
    }
  }
`
const StyledModalSide = styled.section`
  width: 25%;
  height: 90%;
  padding: 1.5rem;
  background: ${({ theme }) => theme.colors.background};
  overflow-y: scroll;
  overflow-scrolling: touch;
  -webkit-overflow-scrolling: touch;
  & ::-webkit-scrollbar {
    display: none;
  }
  z-index: 15;
  h1 {
    margin: 4rem 0;
    text-align: center;
    font-size: 4.5rem;
    letter-spacing: 0.5rem;
    text-shadow: 3px 3px 0px ${({ theme }) => theme.colors.quaternaryshadow};
    color: ${({ theme }) => theme.colors.quaternary};
  }
  ul,
  li {
    list-style-type: none;
  }
  h2,
  .stack {
    display: flex;
    font-family: Josefin Sans;
    font-weight: 600;
    letter-spacing: 0.15rem;
    & h3 {
      font-size: 1rem;
      margin-right: 1rem;
    }
    & ul {
      display: flex;
      flex-wrap: wrap;
    }
    & li {
      margin: 0 0.5rem 0.5rem 0;
      padding: 0.3rem 0.5rem;
      border-radius: 0.5rem;
      background: ${({ theme }) => theme.colors.secondarydarker};
      font-size: 0.8rem;
      color: ${({ theme }) => theme.colors.background};
    }
  }
  .date {
    font-weight: 600;
    margin: 0;
  }
  .screenshot {
    margin: 3rem auto 0;
    text-align: center;
    & img {
      width: 95%;
      max-width: 400px;
      box-shadow: 5px 5px 5px rgb(0 0 0 / 34%);
    }
  }
`

const StyledModalContent = styled.section`
  width: 45%;
  min-width: 30rem;
  height: 90%;
  overflow-y: scroll;
  background: ${({ theme }) => theme.colors.background};
  padding: 1.5rem;
  z-index: 15;
  & ul {
    margin: 0.5rem auto;
    padding-left: 2rem;
  }
  & li {
    margin-bottom: 0.2rem;
  }
  .close-btn {
    position: fixed;
    right: 16.5vw;
    top: 7vh;
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
    z-index: 20;
    cursor: pointer;
  }
`

const Modal = ({ children, closeFn }) => {
  const { body, frontmatter } = children
  const {
    date,
    title,
    type,
    external,
    github,
    gif,
    front,
    back,
    deploy,
  } = frontmatter

  return (
    <StyledModalOverlay>
      <StyledModalSide>
        <p className="date">
          {date} / {type}{" "}
        </p>
        <h1>{title}</h1>
        <div className="stack">
          <h3>front</h3>
          <ul>
            {front.map(stack => (
              <li>{stack}</li>
            ))}
          </ul>
        </div>
        <div className="stack">
          <h3>back</h3>
          <ul>
            {back.map(stack => (
              <li>{stack}</li>
            ))}
          </ul>
        </div>
        <div className="stack">
          <h3>deploy</h3>
          <ul>
            {deploy.map(stack => (
              <li>{stack}</li>
            ))}
          </ul>
        </div>
        <div className="screenshot">
          <img src={gif} alt="screenshot gif" border="0" />
        </div>
      </StyledModalSide>
      <StyledModalContent>
        <span className="close-btn" onClick={() => closeFn(0)}>
          x
        </span>
        <MDXRenderer>{body}</MDXRenderer>
      </StyledModalContent>
    </StyledModalOverlay>
  )
}

export default Modal
