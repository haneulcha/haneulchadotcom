import React, { useContext } from "react"
import styled from "styled-components"
import { MDXRenderer } from "gatsby-plugin-mdx"
import Context from "../context"
import Icon from "./icons"
import { lightTheme, darkTheme } from "../styles/theme"

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
  }
`
const StyledModalWrapper = styled.div`
  display: flex;
  position: relative;
  width: 70%;
  height: 90%;
  border-radius: 0.5rem;
  overflow: hidden;
`
const StyledModalSide = styled.section`
  width: 35%;
  padding: 2.5rem;
  background: ${({ theme }) => theme.colors.background};
  overflow-y: scroll;
  overflow-scrolling: touch;
  -webkit-overflow-scrolling: touch;
  & ::-webkit-scrollbar {
    display: none;
  }
  z-index: 15;
  h1 {
    margin: 4rem 0 2.5rem;
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
    letter-spacing: 0.1rem;
    & h3 {
      font-size: 1rem;
      margin-right: 1rem;
    }
    & ul {
      display: flex;
      flex-wrap: wrap;
    }
    & li {
      margin: 0 0.4rem 0.3rem 0;
      padding: 0.25rem 0.45rem;
      border-radius: 0.5rem;
      background: ${({ theme }) => theme.colors.secondarydarker};
      font-size: 0.75rem;
      color: ${({ theme }) => theme.colors.background};
    }
  }
  .nav {
    text-align: center;
    margin-bottom: 1rem;
    a {
      display: inline-block;
      margin-right: 1rem;
    }
    svg {
      width: 1.3rem;
      height: 1.3rem;
      transition: all 0.3s ease-out;
      fill: ${({ theme }) => theme.colors.tertiary};
    }
    svg:hover {
      fill: ${({ theme }) => theme.colors.primary};
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
  width: 65%;
  overflow-y: scroll;
  background: ${({ theme }) => theme.colors.background};
  padding: 2.5rem;
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
  @media (hover: hover) {
    scrollbar-color: ${({ theme }) => theme.colors.scrollBar} transparent; // Firefox only
    &::-webkit-scrollbar {
      display: block;
      -webkit-appearance: none;
    }
    &::-webkit-scrollbar:horizontal {
      height: 0.8rem;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 8px;
      border: 0.2rem solid ${({ theme }) => theme.colors.background};
      background-color: ${({ theme }) => theme.colors.scrollBar};
    }
    &::-webkit-scrollbar-track {
      background-color: ${({ theme }) => theme.colors.background};
      border-radius: 8px;
    }
  }
`

const Modal = ({ children, closeFn }) => {
  const { darkMode } = useContext(Context).state
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
      <StyledModalWrapper>
        <StyledModalSide>
          <p className="date">
            {date} / {type}{" "}
          </p>
          <h1>{title}</h1>
          <div className="nav">
            {external && (
              <a
                href={external}
                target="_blank"
                rel="nofollow noopener noreferrer"
                aria-label="External Link"
              >
                <Icon
                  name="external"
                  color={
                    darkMode
                      ? darkTheme.colors.subtext
                      : lightTheme.colors.subtext
                  }
                />
              </a>
            )}
            {github && (
              <a
                href={github}
                target="_blank"
                rel="nofollow noopener noreferrer"
                aria-label="Github Link"
              >
                <Icon
                  name="github"
                  color={
                    darkMode
                      ? darkTheme.colors.subtext
                      : lightTheme.colors.subtext
                  }
                />
              </a>
            )}
          </div>
          <div className="stack">
            <h3>front</h3>
            <ul>
              {front.map((stack, i) => (
                <li key={`${i}-f`}>{stack}</li>
              ))}
            </ul>
          </div>
          <div className="stack">
            <h3>back</h3>
            <ul>
              {back.map((stack, i) => (
                <li key={`${i}-b`}>{stack}</li>
              ))}
            </ul>
          </div>
          <div className="stack">
            <h3>deploy</h3>
            <ul>
              {deploy.map((stack, i) => (
                <li key={`${i}-d`}>{stack}</li>
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
      </StyledModalWrapper>
    </StyledModalOverlay>
  )
}

export default Modal
